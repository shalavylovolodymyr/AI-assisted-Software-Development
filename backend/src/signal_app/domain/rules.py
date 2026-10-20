from datetime import date

from .enums import ActionStatus, IssueStatus, Severity
from .exceptions import RuleViolation


def risk_score(likelihood: int, impact: int) -> tuple[int, Severity]:
    if any(type(v) is not int or not 1 <= v <= 5 for v in (likelihood, impact)):
        raise RuleViolation("Likelihood and impact must be integers from 1 to 5.")
    score = likelihood * impact
    severity = (
        Severity.LOW
        if score <= 4
        else Severity.MODERATE
        if score <= 9
        else Severity.HIGH
        if score <= 16
        else Severity.CRITICAL
    )
    return score, severity


TRANSITIONS = {
    IssueStatus.OPEN: {IssueStatus.IN_PROGRESS},
    IssueStatus.IN_PROGRESS: {IssueStatus.OPEN, IssueStatus.MITIGATED},
    IssueStatus.MITIGATED: {IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED},
    IssueStatus.RESOLVED: {IssueStatus.IN_PROGRESS},
}


def validate_transition(source, target, actions, risk) -> None:
    if target not in TRANSITIONS[source]:
        raise RuleViolation(f"Cannot transition from {source} to {target}.")
    if target in (IssueStatus.MITIGATED, IssueStatus.RESOLVED):
        if not actions:
            raise RuleViolation("Plan at least one mitigation action before mitigating this issue.")
        if any(a.status not in (ActionStatus.DONE, ActionStatus.CANCELLED) for a in actions):
            raise RuleViolation("Mitigation actions are incomplete. Complete or cancel outstanding actions.")
    if target == IssueStatus.RESOLVED:
        completed = [a.completed_at for a in actions if a.status == ActionStatus.DONE]
        if not completed or any(t is None for t in completed):
            raise RuleViolation("At least one completed mitigation action is required to resolve an issue.")
        if risk is None or risk.assessed_at <= max(completed):
            raise RuleViolation(
                "Record a risk reassessment after the final action completion before resolving."
            )


def is_overdue(due_date: date | None, status: ActionStatus, today: date) -> bool:
    return bool(due_date and due_date < today and status not in (ActionStatus.DONE, ActionStatus.CANCELLED))
