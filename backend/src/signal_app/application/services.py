from datetime import UTC, datetime
from uuid import UUID, uuid4

from signal_app.domain.entities import (
    AuditEvent,
    Comment,
    Issue,
    MitigationAction,
    Project,
    RiskAssessment,
    User,
)
from signal_app.domain.enums import ActionStatus, IssueStatus, Role
from signal_app.domain.exceptions import Conflict, Forbidden, NotFound, RuleViolation
from signal_app.domain.rules import risk_score, validate_transition

from .ports import Repository, UowFactory


def required(repo: Repository, kind, identifier: UUID, *, lock=False):
    entity = repo.get(kind, identifier, lock=lock)
    if entity is None:
        raise NotFound(f"{kind.__name__} was not found.")
    return entity


def text(value: str, label: str, maximum: int = 10000) -> str:
    if not isinstance(value, str) or not value.strip() or len(value.strip()) > maximum:
        raise RuleViolation(f"{label} must contain 1–{maximum} nonblank characters.")
    return value.strip()


def locked(repo, issue_id, version, *, allow_deleted=False):
    issue = required(repo, Issue, issue_id, lock=True)
    if issue.version != version:
        raise Conflict("This issue changed since you opened it. Refresh and try again.")
    if issue.deleted_at and not allow_deleted:
        raise RuleViolation("Restore the issue before making changes.")
    return issue


def current_risk(repo, issue_id):
    return max(
        repo.list(RiskAssessment, issue_id=issue_id), key=lambda r: (r.assessed_at, str(r.id)), default=None
    )


def audit(repo, issue_id, actor_id, event_type, new_value, previous_value=None):
    repo.add(
        AuditEvent(uuid4(), issue_id, actor_id, event_type, previous_value, new_value, datetime.now(UTC))
    )


def touch(repo, issue):
    issue.version += 1
    issue.updated_at = datetime.now(UTC)
    repo.save(issue)


def assess(repo, issue, actor_id, likelihood, impact, rationale):
    score, severity = risk_score(likelihood, impact)
    previous = current_risk(repo, issue.id)
    assessment = RiskAssessment(
        uuid4(),
        issue.id,
        likelihood,
        impact,
        score,
        severity,
        text(rationale, "Rationale"),
        actor_id,
        datetime.now(UTC),
    )
    repo.add(assessment)
    audit(
        repo,
        issue.id,
        actor_id,
        "RISK_ASSESSED",
        {"score": score, "severity": severity, "likelihood": likelihood, "impact": impact},
        {"score": previous.score, "severity": previous.severity} if previous else None,
    )
    return assessment


class Service:
    def __init__(self, uow: UowFactory):
        self.uow = uow


class CreateIssue(Service):
    def execute(
        self,
        actor_id,
        *,
        project_id,
        title,
        description,
        category,
        priority,
        assignee_id,
        due_date=None,
        likelihood,
        impact,
        rationale,
    ):
        risk_score(likelihood, impact)
        with self.uow() as uow:
            repo = uow.repo
            required(repo, User, actor_id)
            required(repo, User, assignee_id)
            project = required(repo, Project, project_id)
            if project.status != "ACTIVE":
                raise RuleViolation("Create issues in an active project.")
            now = datetime.now(UTC)
            identifier = uuid4()
            issue = Issue(
                identifier,
                f"SIG-{identifier.hex[:8].upper()}",
                project_id,
                text(title, "Title", 180),
                text(description, "Description"),
                category,
                priority,
                IssueStatus.OPEN,
                actor_id,
                assignee_id,
                due_date,
                now,
                now,
            )
            repo.add(issue)
            audit(repo, issue.id, actor_id, "ISSUE_CREATED", {"title": issue.title, "status": issue.status})
            assess(repo, issue, actor_id, likelihood, impact, rationale)
            return issue


class Mitigation(Service):
    def plan(self, issue_id, actor_id, expected_version, *, title, description, owner_id, due_date):
        with self.uow() as uow:
            repo = uow.repo
            required(repo, User, actor_id)
            required(repo, User, owner_id)
            issue = locked(repo, issue_id, expected_version)
            if issue.status not in (IssueStatus.OPEN, IssueStatus.IN_PROGRESS):
                raise RuleViolation("Reopen the issue to IN_PROGRESS before planning further actions.")
            action = MitigationAction(
                uuid4(),
                issue.id,
                text(title, "Title", 180),
                text(description, "Description"),
                owner_id,
                ActionStatus.TODO,
                due_date,
                None,
                datetime.now(UTC),
            )
            repo.add(action)
            audit(
                repo,
                issue.id,
                actor_id,
                "ACTION_PLANNED",
                {"action_id": str(action.id), "title": action.title},
            )
            touch(repo, issue)
            return action

    def complete(self, action_id, actor_id, expected_version, status):
        with self.uow() as uow:
            repo = uow.repo
            actor = required(repo, User, actor_id)
            initial = required(repo, MitigationAction, action_id)
            issue = locked(repo, initial.issue_id, expected_version)
            action = required(repo, MitigationAction, action_id)
            if action.deleted_at:
                raise RuleViolation("Restore the action before changing its status.")
            if actor.role == Role.MEMBER and action.owner_id != actor_id:
                raise Forbidden("Only the action owner or a manager can update this action.")
            if issue.status not in (IssueStatus.OPEN, IssueStatus.IN_PROGRESS):
                raise RuleViolation("Reopen the issue before changing mitigation actions.")
            if action.status in (ActionStatus.DONE, ActionStatus.CANCELLED) or action.status == status:
                raise RuleViolation(f"Cannot transition action from {action.status} to {status}.")
            previous = action.status
            action.status = status
            action.completed_at = datetime.now(UTC) if status == ActionStatus.DONE else None
            repo.save(action)
            event = "ACTION_COMPLETED" if status == ActionStatus.DONE else "ACTION_STATUS_CHANGED"
            audit(
                repo,
                issue.id,
                actor_id,
                event,
                {"action_id": str(action.id), "title": action.title, "status": status},
                {"status": previous},
            )
            touch(repo, issue)
            return action


class ReassessRisk(Service):
    def execute(self, issue_id, actor_id, expected_version, *, likelihood, impact, rationale):
        with self.uow() as uow:
            repo = uow.repo
            required(repo, User, actor_id)
            issue = locked(repo, issue_id, expected_version)
            if issue.status == IssueStatus.RESOLVED:
                raise RuleViolation("Reopen the issue before reassessing its risk.")
            assessment = assess(repo, issue, actor_id, likelihood, impact, rationale)
            touch(repo, issue)
            return assessment


class TransitionIssue(Service):
    def execute(self, issue_id, actor_id, expected_version, status):
        with self.uow() as uow:
            repo = uow.repo
            required(repo, User, actor_id)
            issue = locked(repo, issue_id, expected_version)
            validate_transition(
                issue.status,
                status,
                [a for a in repo.list(MitigationAction, issue_id=issue.id) if not a.deleted_at],
                current_risk(repo, issue.id),
            )
            previous = issue.status
            issue.status = status
            issue.resolved_at = datetime.now(UTC) if status == IssueStatus.RESOLVED else None
            event = "ISSUE_REOPENED" if previous == IssueStatus.RESOLVED else "STATUS_CHANGED"
            audit(repo, issue.id, actor_id, event, {"status": status}, {"status": previous})
            touch(repo, issue)
            return issue


class EditIssue(Service):
    def execute(self, issue_id, actor_id, expected_version, **changes):
        with self.uow() as uow:
            repo = uow.repo
            required(repo, User, actor_id)
            issue = locked(repo, issue_id, expected_version)
            if "assignee_id" in changes:
                required(repo, User, changes["assignee_id"])
            previous, updated = {}, {}
            for name, value in changes.items():
                if name not in ("title", "description", "assignee_id", "priority", "category", "due_date"):
                    raise RuleViolation(f"Cannot edit {name}.")
                if name in ("title", "description"):
                    value = text(value, name.title(), 180 if name == "title" else 10000)
                previous[name] = str(getattr(issue, name))
                setattr(issue, name, value)
                updated[name] = str(value)
            event = "ASSIGNMENT_CHANGED" if "assignee_id" in changes else "ISSUE_UPDATED"
            audit(repo, issue.id, actor_id, event, updated, previous)
            touch(repo, issue)
            return issue


class AddComment(Service):
    def execute(self, issue_id, actor_id, expected_version, body):
        with self.uow() as uow:
            required(uow.repo, User, actor_id)
            issue = locked(uow.repo, issue_id, expected_version)
            comment = Comment(uuid4(), issue.id, actor_id, text(body, "Comment", 5000), datetime.now(UTC))
            uow.repo.add(comment)
            audit(uow.repo, issue.id, actor_id, "COMMENT_ADDED", {"comment_id": str(comment.id)})
            touch(uow.repo, issue)
            return comment


class Deletion(Service):
    """Reversible removal; evidence and terminal action records remain intact."""

    def issue(self, issue_id, actor_id, expected_version, *, restore=False):
        with self.uow() as uow:
            repo = uow.repo
            actor = required(repo, User, actor_id)
            issue = locked(repo, issue_id, expected_version, allow_deleted=True)
            if actor.role == Role.MEMBER and actor_id not in (issue.reporter_id, issue.assignee_id):
                raise Forbidden("Only the reporter, issue owner or a manager can remove this issue.")
            self._change(repo, issue, actor_id, issue, restore)
            return issue

    def action(self, action_id, actor_id, expected_version, *, restore=False):
        with self.uow() as uow:
            repo = uow.repo
            actor = required(repo, User, actor_id)
            initial = required(repo, MitigationAction, action_id)
            issue = locked(repo, initial.issue_id, expected_version)
            action = required(repo, MitigationAction, action_id)
            if actor.role == Role.MEMBER and action.owner_id != actor_id:
                raise Forbidden("Only the action owner or a manager can remove this action.")
            if issue.status not in (IssueStatus.OPEN, IssueStatus.IN_PROGRESS):
                raise RuleViolation("Reopen the issue before removing or restoring actions.")
            if action.status not in (ActionStatus.TODO, ActionStatus.IN_PROGRESS):
                raise RuleViolation("Completed and cancelled actions remain in the history.")
            self._change(repo, issue, actor_id, action, restore)
            return action

    @staticmethod
    def _change(repo, issue, actor_id, record, restore):
        if restore == (record.deleted_at is None):
            raise RuleViolation(
                "The record is already restored." if restore else "The record is already deleted."
            )
        previous = record.deleted_at
        record.deleted_at = None if restore else datetime.now(UTC)
        repo.save(record)
        is_issue = isinstance(record, Issue)
        audit(
            repo,
            issue.id,
            actor_id,
            ("ISSUE_" if is_issue else "ACTION_") + ("RESTORED" if restore else "DELETED"),
            {
                "deleted_at": record.deleted_at.isoformat() if record.deleted_at else None,
                "title": record.title,
                **({} if is_issue else {"action_id": str(record.id)}),
            },
            {"deleted_at": previous.isoformat() if previous else None},
        )
        touch(repo, issue)
