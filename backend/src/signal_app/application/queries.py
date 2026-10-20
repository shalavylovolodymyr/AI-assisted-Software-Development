from collections import Counter
from dataclasses import asdict
from datetime import UTC, datetime

from signal_app.domain.entities import (
    AuditEvent,
    Comment,
    Issue,
    MitigationAction,
    Project,
    RiskAssessment,
    User,
)
from signal_app.domain.enums import ActionStatus, IssueStatus, Severity
from signal_app.domain.rules import is_overdue, risk_score

from .analytics import build_trends
from .operations import build_operations
from .services import Service, required


class Queries(Service):
    def catalog(self):
        with self.uow() as uow:
            return {
                "users": [asdict(u) for u in sorted(uow.repo.list(User), key=lambda u: u.full_name)],
                "projects": [asdict(p) for p in sorted(uow.repo.list(Project), key=lambda p: p.name)],
            }

    def _portfolio(self, repo, *, deleted=False):
        users = {u.id: asdict(u) for u in repo.list(User)}
        projects = {p.id: asdict(p) for p in repo.list(Project)}
        risks = {}
        for risk in sorted(repo.list(RiskAssessment), key=lambda r: (r.assessed_at, str(r.id))):
            risks[risk.issue_id] = asdict(risk)
        return [
            dict(
                asdict(i),
                risk=risks.get(i.id),
                project=projects[i.project_id],
                assignee=users[i.assignee_id],
                reporter=users[i.reporter_id],
            )
            for i in repo.list(Issue)
            if deleted is None or bool(i.deleted_at) == deleted
        ]

    def issues(
        self,
        *,
        search="",
        status=None,
        severity=None,
        project_id=None,
        assignee_id=None,
        active_only=False,
        deleted=False,
        sort="updated_at",
        direction="desc",
        page=1,
        page_size=10,
    ):
        with self.uow() as uow:
            items = self._portfolio(uow.repo, deleted=deleted)
        items = [
            i
            for i in items
            if (not search or search.lower() in (i["title"] + i["reference_code"]).lower())
            and (not status or i["status"] == status)
            and (not active_only or i["status"] != IssueStatus.RESOLVED)
            and (not severity or (i["risk"] and i["risk"]["severity"] == severity))
            and (not project_id or i["project_id"] == project_id)
            and (not assignee_id or i["assignee_id"] == assignee_id)
        ]

        def key(i):
            if sort == "risk_score":
                return i["risk"]["score"] if i["risk"] else 0
            if sort == "due_date":
                return str(i["due_date"] or "9999-12-31")
            return i[sort]

        items.sort(key=key, reverse=direction == "desc")
        return {
            "items": items[(page - 1) * page_size : page * page_size],
            "total": len(items),
            "page": page,
            "page_size": page_size,
        }

    def detail(self, identifier):
        with self.uow() as uow:
            repo = uow.repo
            required(repo, Issue, identifier)
            item = next(i for i in self._portfolio(repo, deleted=None) if i["id"] == identifier)
            users = {u.id: asdict(u) for u in repo.list(User)}
            item["assessments"] = [
                dict(asdict(r), assessor=users[r.assessed_by])
                for r in sorted(
                    repo.list(RiskAssessment, issue_id=identifier), key=lambda r: (r.assessed_at, str(r.id))
                )
            ]
            item["actions"] = self._actions(repo, identifier)
            item["comments"] = [
                dict(asdict(c), author=users[c.author_id])
                for c in sorted(repo.list(Comment, issue_id=identifier), key=lambda c: c.created_at)
            ]
            item["activity"] = self._activity(repo, identifier)
            return item

    def _actions(self, repo, issue_id=None, *, deleted=False):
        users = {u.id: asdict(u) for u in repo.list(User)}
        issues = {i.id: i for i in repo.list(Issue)}
        actions = repo.list(MitigationAction, **({"issue_id": issue_id} if issue_id else {}))
        today = datetime.now(UTC).date()
        return [
            dict(
                asdict(a),
                owner=users[a.owner_id],
                issue_reference=issues[a.issue_id].reference_code,
                issue_title=issues[a.issue_id].title,
                issue_status=issues[a.issue_id].status,
                issue_version=issues[a.issue_id].version,
                issue_deleted=bool(issues[a.issue_id].deleted_at),
                overdue=issues[a.issue_id].status != IssueStatus.RESOLVED
                and is_overdue(a.due_date, a.status, today),
            )
            for a in sorted(actions, key=lambda a: (a.due_date, a.created_at))
            if bool(a.deleted_at) == deleted and (issue_id or not issues[a.issue_id].deleted_at)
        ]

    def actions(self, status=None, owner_id=None, *, deleted=False):
        with self.uow() as uow:
            items = self._actions(uow.repo, deleted=deleted)
        return [
            a
            for a in items
            if (not status or a["status"] == status) and (not owner_id or a["owner_id"] == owner_id)
        ]

    def _activity(self, repo, issue_id=None):
        users = {u.id: asdict(u) for u in repo.list(User)}
        issues = {i.id: i for i in repo.list(Issue)}
        events = repo.list(AuditEvent, **({"issue_id": issue_id} if issue_id else {}))
        return [
            dict(
                asdict(e),
                actor=users[e.actor_id],
                issue_reference=issues[e.issue_id].reference_code,
                issue_title=issues[e.issue_id].title,
            )
            for e in sorted(events, key=lambda e: e.occurred_at, reverse=True)
        ]

    def activity(self, page=1, page_size=30, search="", event_type=None, project_id=None):
        with self.uow() as uow:
            items = self._activity(uow.repo)
            project_issues = {i.id for i in uow.repo.list(Issue) if i.project_id == project_id}
        needle = search.strip().lower()
        items = [
            e
            for e in items
            if (
                not needle
                or needle
                in (e["issue_title"] + " " + e["issue_reference"] + " " + e["actor"]["full_name"]).lower()
            )
            and (not event_type or e["event_type"] == event_type)
            and (not project_id or e["issue_id"] in project_issues)
        ]
        return {
            "items": items[(page - 1) * page_size : page * page_size],
            "total": len(items),
            "page": page,
            "page_size": page_size,
        }

    def trends(self, days=90, now=None):
        with self.uow() as uow:
            repo = uow.repo
            return build_trends(
                repo.list(Issue),
                repo.list(RiskAssessment),
                repo.list(MitigationAction),
                repo.list(AuditEvent),
                days,
                now or datetime.now(UTC),
            )

    def summary(self):
        with self.uow() as uow:
            repo = uow.repo
            items = self._portfolio(repo)
            actions = self._actions(repo)
            activity = self._activity(repo)[:6]
            users = {u.id: asdict(u) for u in repo.list(User)}
            projects = repo.list(Project)
        active = [i for i in items if i["status"] != IssueStatus.RESOLVED]
        critical = [i for i in active if i["risk"] and i["risk"]["severity"] == Severity.CRITICAL]
        distribution = [
            {"severity": s.value, "count": sum(1 for i in active if i["risk"] and i["risk"]["severity"] == s)}
            for s in Severity
        ]
        matrix = []
        for impact in range(5, 0, -1):
            for likelihood in range(1, 6):
                score, severity = risk_score(likelihood, impact)
                matching = [
                    i
                    for i in active
                    if i["risk"] and i["risk"]["impact"] == impact and i["risk"]["likelihood"] == likelihood
                ]
                matrix.append(
                    {
                        "impact": impact,
                        "likelihood": likelihood,
                        "score": score,
                        "severity": severity,
                        "count": len(matching),
                        "issues": matching,
                    }
                )
        required_actions = [a for a in actions if a["status"] != ActionStatus.CANCELLED]
        done = sum(a["status"] == ActionStatus.DONE for a in required_actions)
        project_stats = []
        for p in projects:
            pi = [i for i in active if i["project_id"] == p.id]
            pa = [
                a
                for a in required_actions
                if any(i["id"] == a["issue_id"] for i in items if i["project_id"] == p.id)
            ]
            pdone = sum(a["status"] == ActionStatus.DONE for a in pa)
            project_stats.append(
                dict(
                    asdict(p),
                    owner=users[p.owner_id],
                    active_issues=len(pi),
                    critical_risks=sum(i["risk"]["severity"] == Severity.CRITICAL for i in pi if i["risk"]),
                    progress=round(100 * pdone / len(pa)) if pa else 0,
                )
            )
        statuses = Counter(i["status"] for i in items)
        return {
            "active_issues": len(active),
            "critical_risks": len(critical),
            "overdue_actions": sum(a["overdue"] for a in actions),
            "resolved_issues": len(items) - len(active),
            "total_issues": len(items),
            "distribution": distribution,
            "statuses": [{"status": s, "count": statuses[s]} for s in IssueStatus],
            "critical_issues": sorted(critical, key=lambda i: i["risk"]["score"], reverse=True),
            "activity": activity,
            "matrix": matrix,
            "projects": project_stats,
            "mitigation": {
                "done": done,
                "total": len(required_actions),
                "progress": round(100 * done / len(required_actions)) if required_actions else 0,
            },
            "generated_at": datetime.now(UTC),
        }

    def operations(self, now=None):
        with self.uow() as uow:
            repo = uow.repo
            return build_operations(
                repo.list(Issue),
                repo.list(RiskAssessment),
                repo.list(MitigationAction),
                repo.list(User),
                repo.list(Project),
                now or datetime.now(UTC),
            )
