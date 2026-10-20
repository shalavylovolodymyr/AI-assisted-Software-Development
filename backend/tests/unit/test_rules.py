from datetime import UTC, date, datetime, timedelta
from types import SimpleNamespace

import pytest

from signal_app.domain.entities import Issue, MitigationAction, RiskAssessment
from signal_app.domain.enums import ActionStatus, IssueStatus, Severity
from signal_app.domain.exceptions import RuleViolation
from signal_app.domain.rules import is_overdue, risk_score, validate_transition


@pytest.mark.parametrize(
    "likelihood,impact,score,severity",
    [
        (1, 1, 1, Severity.LOW),
        (2, 2, 4, Severity.LOW),
        (1, 5, 5, Severity.MODERATE),
        (3, 3, 9, Severity.MODERATE),
        (2, 5, 10, Severity.HIGH),
        (4, 4, 16, Severity.HIGH),
        (5, 4, 20, Severity.CRITICAL),
        (5, 5, 25, Severity.CRITICAL),
    ],
)
def test_risk_boundaries(likelihood, impact, score, severity):
    assert risk_score(likelihood, impact) == (score, severity)


@pytest.mark.parametrize("bad", [-1, 0, 6, 1.2, True, "3", None])
def test_reject_invalid_risk(bad):
    with pytest.raises(RuleViolation):
        risk_score(bad, 2)
    with pytest.raises(RuleViolation):
        risk_score(2, bad)


ALLOWED = {
    ("OPEN", "IN_PROGRESS"),
    ("IN_PROGRESS", "OPEN"),
    ("IN_PROGRESS", "MITIGATED"),
    ("MITIGATED", "IN_PROGRESS"),
    ("MITIGATED", "RESOLVED"),
    ("RESOLVED", "IN_PROGRESS"),
}


@pytest.mark.parametrize("source", list(IssueStatus))
@pytest.mark.parametrize("target", list(IssueStatus))
def test_every_workflow_pair(source, target):
    now = datetime.now(UTC)
    actions = [SimpleNamespace(status=ActionStatus.DONE, completed_at=now - timedelta(seconds=1))]
    risk = SimpleNamespace(assessed_at=now)
    if (source.value, target.value) in ALLOWED:
        validate_transition(source, target, actions, risk)
    else:
        with pytest.raises(RuleViolation):
            validate_transition(source, target, actions, risk)


def test_mitigation_needs_a_plan_and_complete_actions():
    with pytest.raises(RuleViolation, match="at least one"):
        validate_transition(IssueStatus.IN_PROGRESS, IssueStatus.MITIGATED, [], None)
    for status in (ActionStatus.TODO, ActionStatus.IN_PROGRESS):
        with pytest.raises(RuleViolation, match="incomplete"):
            validate_transition(
                IssueStatus.IN_PROGRESS, IssueStatus.MITIGATED, [SimpleNamespace(status=status)], None
            )


def test_cancelled_actions_and_resolution_evidence():
    actions = [SimpleNamespace(status=ActionStatus.CANCELLED, completed_at=None)]
    validate_transition(IssueStatus.IN_PROGRESS, IssueStatus.MITIGATED, actions, None)
    with pytest.raises(RuleViolation, match="completed"):
        validate_transition(IssueStatus.MITIGATED, IssueStatus.RESOLVED, actions, None)


@pytest.mark.parametrize("offset", [-1, 0])
def test_resolution_requires_strictly_later_reassessment(offset):
    now = datetime.now(UTC)
    actions = [SimpleNamespace(status=ActionStatus.DONE, completed_at=now)]
    for risk in (None, SimpleNamespace(assessed_at=now + timedelta(seconds=offset))):
        with pytest.raises(RuleViolation, match="reassess"):
            validate_transition(IssueStatus.MITIGATED, IssueStatus.RESOLVED, actions, risk)


def test_resolution_rechecks_incomplete_work():
    with pytest.raises(RuleViolation, match="incomplete"):
        validate_transition(
            IssueStatus.MITIGATED, IssueStatus.RESOLVED, [SimpleNamespace(status=ActionStatus.TODO)], None
        )


def test_overdue_uses_date_not_midnight_and_ignores_terminal_actions():
    today = date(2026, 10, 19)
    assert is_overdue(today - timedelta(days=1), ActionStatus.TODO, today)
    assert not is_overdue(today, ActionStatus.IN_PROGRESS, today)
    assert not is_overdue(None, ActionStatus.TODO, today)
    for status in (ActionStatus.DONE, ActionStatus.CANCELLED):
        assert not is_overdue(today - timedelta(days=1), status, today)


def test_domain_records_are_framework_independent():
    assert Issue.__module__.startswith("signal_app.domain")
    assert MitigationAction.__module__.startswith("signal_app.domain")
    assert RiskAssessment.__dataclass_params__.frozen
