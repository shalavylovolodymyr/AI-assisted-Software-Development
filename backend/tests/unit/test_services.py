"""Application tests use a copy-on-write UoW, never a database or web framework."""

from copy import deepcopy
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from signal_app.application.services import CreateIssue, Mitigation, ReassessRisk, TransitionIssue
from signal_app.domain.entities import AuditEvent, Issue, Project, RiskAssessment, User
from signal_app.domain.enums import ActionStatus, Category, IssueStatus, Priority, Role
from signal_app.domain.exceptions import Conflict, NotFound, RuleViolation


class MemoryRepository:
    def __init__(self, records):
        self.records = records

    def get(self, kind, identifier, *, lock=False):
        return self.records.get((kind, identifier))

    def list(self, kind, **filters):
        return [
            deepcopy(v)
            for (k, _), v in self.records.items()
            if k is kind and all(getattr(v, f) == x for f, x in filters.items())
        ]

    def add(self, entity):
        self.records[(type(entity), entity.id)] = deepcopy(entity)

    save = add


class MemoryUow:
    def __init__(self):
        self.records = {}
        self.fail = False

    def __call__(self):
        return self

    def __enter__(self):
        self.repo = MemoryRepository(deepcopy(self.records))
        return self

    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            if self.fail:
                raise RuntimeError("Simulated commit failure")
            self.records = self.repo.records


@pytest.fixture
def context():
    uow = MemoryUow()
    now = datetime.now(UTC)
    user = User(uuid4(), "Emma Wilson", "emma@example.test", Role.MANAGER, "#A78BFA", now)
    project = Project(uuid4(), "Digital Operations", "DOP", "Operations", "ACTIVE", user.id, now)
    uow.records = {(User, user.id): user, (Project, project.id): project}
    return uow, user, project


def create(context):
    uow, user, project = context
    return CreateIssue(uow).execute(
        user.id,
        project_id=project.id,
        title="Access review",
        description="Review privileged access",
        category=Category.SECURITY,
        priority=Priority.HIGH,
        assignee_id=user.id,
        due_date=None,
        likelihood=4,
        impact=5,
        rationale="Initial exposure",
    )


def test_create_and_history(context):
    uow, user, _ = context
    issue = create(context)
    old = deepcopy(uow.records)
    ReassessRisk(uow).execute(issue.id, user.id, 1, likelihood=2, impact=2, rationale="Reviewed")
    assessments = [v for (k, _), v in uow.records.items() if k is RiskAssessment]
    assert sorted(r.score for r in assessments) == [4, 20]
    for key, value in old.items():
        if key[0] is RiskAssessment:
            assert uow.records[key] == value
    assert len([k for k in uow.records if k[0] is AuditEvent]) == 3


def test_failure_rolls_back_creation(context):
    uow, _, _ = context
    original = deepcopy(uow.records)
    uow.fail = True
    with pytest.raises(RuntimeError):
        create(context)
    assert uow.records == original


def test_missing_reference_leaves_no_issue(context):
    uow, user, project = context
    del uow.records[(Project, project.id)]
    with pytest.raises(NotFound):
        create(context)
    assert len(uow.records) == 1


def test_stale_and_failed_transition_have_no_audit(context):
    uow, user, _ = context
    issue = create(context)
    original = deepcopy(uow.records)
    with pytest.raises(Conflict):
        TransitionIssue(uow).execute(issue.id, user.id, 0, IssueStatus.IN_PROGRESS)
    with pytest.raises(RuleViolation):
        TransitionIssue(uow).execute(issue.id, user.id, 1, IssueStatus.RESOLVED)
    assert uow.records == original


def test_full_application_workflow_and_reopen(context):
    uow, user, _ = context
    issue = create(context)
    action = Mitigation(uow).plan(
        issue.id,
        user.id,
        1,
        title="Rotate access keys",
        description="Replace shared credentials",
        owner_id=user.id,
        due_date=datetime.now(UTC).date(),
    )
    TransitionIssue(uow).execute(issue.id, user.id, 2, IssueStatus.IN_PROGRESS)
    Mitigation(uow).complete(action.id, user.id, 3, ActionStatus.DONE)
    TransitionIssue(uow).execute(issue.id, user.id, 4, IssueStatus.MITIGATED)
    with pytest.raises(RuleViolation, match="reassess"):
        TransitionIssue(uow).execute(issue.id, user.id, 5, IssueStatus.RESOLVED)
    ReassessRisk(uow).execute(issue.id, user.id, 5, likelihood=2, impact=2, rationale="Verified")
    resolved = TransitionIssue(uow).execute(issue.id, user.id, 6, IssueStatus.RESOLVED)
    assert resolved.resolved_at is not None
    reopened = TransitionIssue(uow).execute(issue.id, user.id, 7, IssueStatus.IN_PROGRESS)
    assert reopened.resolved_at is None
    assert len([k for k in uow.records if k[0] is RiskAssessment]) == 2
    assert uow.records[(Issue, issue.id)].version == 8


def test_action_transition_owner_and_terminal_rules(context):
    uow, user, _ = context
    issue = create(context)
    action = Mitigation(uow).plan(
        issue.id,
        user.id,
        1,
        title="Review accounts",
        description="Check",
        owner_id=user.id,
        due_date=datetime.now(UTC).date() - timedelta(days=1),
    )
    Mitigation(uow).complete(action.id, user.id, 2, ActionStatus.CANCELLED)
    with pytest.raises(RuleViolation):
        Mitigation(uow).complete(action.id, user.id, 3, ActionStatus.DONE)
