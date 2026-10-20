from datetime import UTC, datetime, timedelta
from uuid import uuid4

from test_services import MemoryUow

from signal_app.application.queries import Queries
from signal_app.domain.entities import Issue, MitigationAction, Project, RiskAssessment, User
from signal_app.domain.enums import ActionStatus, Category, IssueStatus, Priority, Role
from signal_app.domain.rules import risk_score

NOW = datetime(2026, 10, 20, 12, tzinfo=UTC)


def portfolio():
    user = User(uuid4(), "Emma", "emma@example.test", Role.ADMIN, "#000", NOW)
    project = Project(uuid4(), "Operations", "OPS", "", "ACTIVE", user.id, NOW)
    return user, project, [user, project]


def issue(records, user, project, age=10, status=IssueStatus.IN_PROGRESS):
    created = NOW - timedelta(days=age)
    item = Issue(uuid4(), f"SIG-{len(records)}", project.id, "Review access", "Context",
                 Category.SECURITY, Priority.HIGH, status, user.id, user.id, None, created, created)
    records.append(item)
    return item


def assess(records, item, user, pair, age=1):
    score, severity = risk_score(*pair)
    records.append(RiskAssessment(uuid4(), item.id, *pair, score, severity, "Review", user.id,
                                  NOW - timedelta(days=age)))


def action(records, item, user, due_offset=0, status=ActionStatus.TODO, completed=None):
    records.append(MitigationAction(uuid4(), item.id, "Review", "Context", user.id, status,
                                    NOW.date() + timedelta(days=due_offset), completed,
                                    item.created_at))


def run(records):
    factory = MemoryUow()
    factory.records = {(type(record), record.id): record for record in records}
    return Queries(factory).operations(now=NOW)


def counts(rows):
    return [row["count"] for row in rows]


def test_empty_operations_have_zero_counts_and_no_invented_percentages():
    data = run([])
    assert counts(data["aging"]) == [0, 0, 0, 0]
    assert counts(data["review_freshness"]) == [0, 0, 0]
    assert counts(data["action_outlook"]) == [0, 0, 0, 0]
    assert data["metrics"]["on_time_completion"] is None
    assert data["projects"] == data["owners"] == []


def test_aging_review_and_project_owner_totals_exclude_resolved_and_future_records():
    user, project, records = portfolio()
    for age in [7, 8, 30, 31, 90, 91]:
        item = issue(records, user, project, age)
        assess(records, item, user, (5, 4), age=30 if age <= 30 else 31)
    issue(records, user, project, 100, IssueStatus.RESOLVED)
    issue(records, user, project, -1)
    data = run(records)
    assert counts(data["aging"]) == [1, 2, 2, 1]
    assert counts(data["review_freshness"]) == [3, 3, 0]
    assert data["metrics"]["unplanned_issues"] == 6
    assert data["metrics"]["stale_reviews"] == 3
    assert data["owners"][0]["active"] == data["projects"][0]["active"] == 6
    assert data["projects"][0]["average_risk"] == 20
    assert data["owners"][0]["critical"] == 6


def test_action_outlook_uses_today_and_seven_day_boundaries_and_ignores_terminal_actions():
    user, project, records = portfolio()
    item = issue(records, user, project)
    for offset in [-1, 0, 1, 7, 8]:
        action(records, item, user, offset)
    action(records, item, user, -1, ActionStatus.CANCELLED)
    action(records, item, user, -1, ActionStatus.DONE, NOW - timedelta(days=2))
    resolved = issue(records, user, project, status=IssueStatus.RESOLVED)
    action(records, resolved, user, -1)
    data = run(records)
    assert counts(data["action_outlook"]) == [1, 1, 2, 1]
    assert data["owners"][0]["overdue_actions"] == 1
    assert data["projects"][0]["overdue_actions"] == 1
    assert data["metrics"]["unplanned_issues"] == 0
    assert len(data["overdue_actions"]) == 1


def test_risk_movement_uses_first_and_latest_valid_assessments_without_future_values():
    user, project, records = portfolio()
    for before, after in [((5, 4), (2, 2)), ((1, 1), (5, 5)), ((2, 2), (2, 2))]:
        item = issue(records, user, project)
        assess(records, item, user, before, age=5)
        assess(records, item, user, after, age=1)
        assess(records, item, user, (1, 1), age=-1)
    baseline = issue(records, user, project)
    assess(records, baseline, user, (3, 3))
    issue(records, user, project)
    data = run(records)
    assert counts(data["risk_movement"]) == [1, 1, 1, 2]
    assert counts(data["review_freshness"]) == [4, 0, 1]


def test_risk_reviews_after_completion_and_on_time_rate_have_real_denominators():
    user, project, records = portfolio()
    pending = issue(records, user, project)
    assess(records, pending, user, (4, 4), age=2)
    action(records, pending, user, 0, ActionStatus.DONE, NOW - timedelta(days=1))
    reviewed = issue(records, user, project)
    action(records, reviewed, user, -3, ActionStatus.DONE, NOW - timedelta(days=2))
    assess(records, reviewed, user, (2, 2), age=1)
    cancelled = issue(records, user, project)
    action(records, cancelled, user, -1, ActionStatus.CANCELLED)
    data = run(records)
    assert data["metrics"]["awaiting_review"] == 1
    assert data["metrics"]["on_time_completion"] == 50
    assert data["metrics"]["unplanned_issues"] == 1
