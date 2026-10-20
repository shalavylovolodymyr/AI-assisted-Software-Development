from copy import deepcopy
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
import test_services
from test_services import create

from signal_app.application import services
from signal_app.application.queries import Queries
from signal_app.domain.entities import AuditEvent, Issue, MitigationAction, RiskAssessment, User
from signal_app.domain.enums import ActionStatus, IssueStatus, Role
from signal_app.domain.exceptions import Conflict, Forbidden, RuleViolation

context = test_services.context


def plan(context):
    uow, user, _ = context
    issue = create(context)
    action = services.Mitigation(uow).plan(
        issue.id,
        user.id,
        1,
        title="Remove obsolete access",
        description="Review access",
        owner_id=user.id,
        due_date=datetime.now(UTC).date() - timedelta(days=1),
    )
    return issue, action


def test_issue_removal_restore_and_immutable_history(context):
    uow, user, _ = context
    issue, action = plan(context)
    before = deepcopy(uow.records)
    removed = services.Deletion(uow).issue(issue.id, user.id, 2)
    assert removed.deleted_at and removed.version == 3
    assert Queries(uow).issues()["total"] == 0
    assert Queries(uow).issues(deleted=True)["items"][0]["id"] == issue.id
    assert Queries(uow).actions() == []
    assert Queries(uow).summary()["total_issues"] == 0
    assert sum(r["count"] for r in Queries(uow).operations()["aging"]) == 0
    assert Queries(uow).detail(issue.id)["deleted_at"]
    for key, value in before.items():
        if key[0] in (RiskAssessment, MitigationAction, AuditEvent):
            assert uow.records[key] == value
    restored = services.Deletion(uow).issue(issue.id, user.id, 3, restore=True)
    assert restored.deleted_at is None and restored.version == 4
    assert Queries(uow).issues()["total"] == 1
    assert Queries(uow).actions()[0]["id"] == action.id


def test_action_removal_restore_and_current_queues(context):
    uow, user, _ = context
    issue, action = plan(context)
    removed = services.Deletion(uow).action(action.id, user.id, 2)
    assert removed.deleted_at and removed.status == ActionStatus.TODO
    assert Queries(uow).actions() == []
    assert Queries(uow).actions(deleted=True)[0]["id"] == action.id
    assert Queries(uow).summary()["overdue_actions"] == 0
    assert Queries(uow).operations()["metrics"]["unplanned_issues"] == 1
    with pytest.raises(RuleViolation):
        services.Mitigation(uow).complete(action.id, user.id, 3, ActionStatus.DONE)
    restored = services.Deletion(uow).action(action.id, user.id, 3, restore=True)
    assert restored.deleted_at is None and restored.status == ActionStatus.TODO
    assert Queries(uow).actions()[0]["overdue"]


def test_deleted_issue_blocks_mutations_and_stale_or_duplicate_deletion(context):
    uow, user, _ = context
    issue, _ = plan(context)
    services.Deletion(uow).issue(issue.id, user.id, 2)
    before = deepcopy(uow.records)
    with pytest.raises(Conflict):
        services.Deletion(uow).issue(issue.id, user.id, 2, restore=True)
    with pytest.raises(RuleViolation):
        services.Deletion(uow).issue(issue.id, user.id, 3)
    with pytest.raises(RuleViolation):
        services.AddComment(uow).execute(issue.id, user.id, 3, "Blocked")
    with pytest.raises(RuleViolation):
        services.EditIssue(uow).execute(issue.id, user.id, 3, title="Blocked")
    assert uow.records == before


def test_deletion_permission_terminal_actions_and_rollback(context):
    uow, user, _ = context
    issue, action = plan(context)
    other = User(uuid4(), "Other member", "other@example.test", Role.MEMBER, "#888888", datetime.now(UTC))
    uow.records[(User, other.id)] = other
    before = deepcopy(uow.records)
    with pytest.raises(Forbidden):
        services.Deletion(uow).issue(issue.id, other.id, 2)
    with pytest.raises(Forbidden):
        services.Deletion(uow).action(action.id, other.id, 2)
    assert uow.records == before
    uow.fail = True
    with pytest.raises(RuntimeError):
        services.Deletion(uow).issue(issue.id, user.id, 2)
    assert uow.records == before
    uow.fail = False
    services.Mitigation(uow).complete(action.id, user.id, 2, ActionStatus.DONE)
    with pytest.raises(RuleViolation):
        services.Deletion(uow).action(action.id, user.id, 3)


def test_deleted_actions_do_not_block_mitigation_or_return_to_closed_issues(context):
    uow, user, _ = context
    issue, action = plan(context)
    services.Deletion(uow).action(action.id, user.id, 2)
    services.TransitionIssue(uow).execute(issue.id, user.id, 3, IssueStatus.IN_PROGRESS)
    with pytest.raises(RuleViolation, match="Plan"):
        services.TransitionIssue(uow).execute(issue.id, user.id, 4, IssueStatus.MITIGATED)
    uow.records[(Issue, issue.id)].status = IssueStatus.MITIGATED
    with pytest.raises(RuleViolation):
        services.Deletion(uow).action(action.id, user.id, 4, restore=True)


def test_trend_deletion_is_effective_from_recorded_event(context):
    uow, user, _ = context
    issue = create(context)
    now = datetime.now(UTC)
    uow.records[(Issue, issue.id)].created_at = now - timedelta(days=2)
    services.Deletion(uow).issue(issue.id, user.id, 1)
    rows = Queries(uow).trends(3, now=datetime.now(UTC))["timeline"]
    assert [row["active"] for row in rows] == [1, 1, 0]
    services.Deletion(uow).issue(issue.id, user.id, 2, restore=True)
    assert Queries(uow).trends(3, now=datetime.now(UTC))["timeline"][-1]["active"] == 1
