from datetime import UTC, datetime, timedelta
from uuid import uuid4

from test_services import MemoryUow

from signal_app.application.queries import Queries
from signal_app.domain.entities import AuditEvent, Issue, MitigationAction, Project, RiskAssessment, User
from signal_app.domain.enums import ActionStatus, Category, IssueStatus, Priority, Role
from signal_app.domain.rules import risk_score


def test_daily_trends_replay_resolutions_reopens_and_latest_risk():
    factory = MemoryUow()
    start = datetime(2026, 10, 1, 9, tzinfo=UTC)
    user = User(uuid4(), "Emma", "emma@example.test", Role.MANAGER, "#000", start)
    project = Project(uuid4(), "Operations", "OPS", "", "ACTIVE", user.id, start)
    issue = Issue(
        uuid4(),
        "SIG-TREND",
        project.id,
        "Access scope",
        "Review",
        Category.SECURITY,
        Priority.HIGH,
        IssueStatus.IN_PROGRESS,
        user.id,
        user.id,
        None,
        start,
        start,
    )
    old = Issue(
        uuid4(),
        "SIG-OLD",
        project.id,
        "Old issue",
        "Review",
        Category.OPERATIONS,
        Priority.LOW,
        IssueStatus.RESOLVED,
        user.id,
        user.id,
        None,
        start - timedelta(days=10),
        start - timedelta(days=5),
        start - timedelta(days=5),
    )
    records = [user, project, issue, old]
    for offset, status, item in [(1, "RESOLVED", issue), (2, "IN_PROGRESS", issue), (-5, "RESOLVED", old)]:
        records.append(
            AuditEvent(
                uuid4(),
                item.id,
                user.id,
                "STATUS_CHANGED",
                None,
                {"status": status},
                start + timedelta(days=offset),
            )
        )
    for offset, pair in [(0, (4, 5)), (1, (2, 2)), (3, (3, 3)), (8, (5, 5))]:
        score, severity = risk_score(*pair)
        records.append(
            RiskAssessment(
                uuid4(), issue.id, *pair, score, severity, "Reviewed", user.id, start + timedelta(days=offset)
            )
        )
    records.append(
        MitigationAction(
            uuid4(),
            issue.id,
            "Review access",
            "Check",
            user.id,
            ActionStatus.DONE,
            start.date(),
            start + timedelta(days=1),
            start,
        )
    )
    factory.records = {(type(record), record.id): record for record in records}
    data = Queries(factory).trends(days=5, now=start + timedelta(days=4))
    assert [day["active"] for day in data["timeline"]] == [1, 0, 1, 1, 1]
    assert [day["average_risk"] for day in data["timeline"]] == [20, None, 4, 9, 9]
    assert [day["created"] for day in data["timeline"]] == [1, 0, 0, 0, 0]
    assert [day["resolved"] for day in data["timeline"]] == [0, 1, 0, 0, 0]
    assert data["metrics"]["completed_actions"] == 1
    assert data["metrics"]["assessments"] == 3  # Future assessment is excluded.
    assert data["metrics"]["resolution_days"] == 1
    assert sum(row["count"] for row in data["categories"]) == 1


def test_empty_trends_have_complete_buckets_and_no_invented_risk():
    data = Queries(MemoryUow()).trends(days=30, now=datetime(2026, 10, 20, tzinfo=UTC))
    assert len(data["timeline"]) == 30
    assert all(day["active"] == 0 and day["average_risk"] is None for day in data["timeline"])
    assert data["metrics"]["resolution_days"] is None
    assert data["total_events"] == 0


def test_bucket_dates_use_utc_even_when_database_returns_a_local_offset():
    from datetime import timezone

    factory = MemoryUow()
    now = datetime(2026, 10, 19, 22, 30, tzinfo=UTC)
    local = now.astimezone(timezone(timedelta(hours=2)))
    issue = Issue(
        uuid4(),
        "SIG-UTC",
        uuid4(),
        "Access review",
        "Review",
        Category.SECURITY,
        Priority.HIGH,
        IssueStatus.OPEN,
        uuid4(),
        uuid4(),
        None,
        local,
        local,
    )
    factory.records = {(Issue, issue.id): issue}
    data = Queries(factory).trends(days=7, now=now)
    assert data["metrics"]["created"] == 1
    assert data["timeline"][-1]["created"] == 1
