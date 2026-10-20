from signal_app.application.queries import Queries
from signal_app.application.services import current_risk
from signal_app.domain.entities import AuditEvent, Issue, MitigationAction, RiskAssessment
from signal_app.domain.enums import IssueStatus
from signal_app.domain.rules import validate_transition
from signal_app.seed import HISTORY_ANCHOR, identifier, seed


def test_expansion_populates_every_cell_and_preserves_existing_records(database):
    from signal_app.seed import seed_history

    factory = database[1]
    seed(factory)
    with factory() as uow:
        original = uow.repo.get(Issue, identifier("issue/0"))
        original.title = "Owner's edited issue"
        uow.repo.save(original)
        before = uow.repo.list(RiskAssessment, issue_id=original.id)
    assert seed_history(factory) is True
    assert seed_history(factory) is False
    with factory() as uow:
        assert uow.repo.get(Issue, original.id).title == "Owner's edited issue"
        assert uow.repo.list(RiskAssessment, issue_id=original.id) == before
        assert len(uow.repo.list(AuditEvent)) >= 2500
        oldest = min(issue.created_at for issue in uow.repo.list(Issue))
        assert (HISTORY_ANCHOR - oldest).days >= 365
        for issue in uow.repo.list(Issue):
            if issue.status == IssueStatus.RESOLVED:
                validate_transition(
                    IssueStatus.MITIGATED,
                    IssueStatus.RESOLVED,
                    uow.repo.list(MitigationAction, issue_id=issue.id),
                    current_risk(uow.repo, issue.id),
                )
    summary = Queries(factory).summary()
    assert len(summary["matrix"]) == 25
    assert all(cell["count"] >= 3 for cell in summary["matrix"])
    assert Queries(factory).activity(page=2, page_size=50)["total"] >= 2500


def test_varied_history_has_irregular_timing_and_valid_evidence(database):
    from signal_app.seed import seed_history

    factory = database[1]
    seed(factory)
    seed_history(factory)
    with factory() as uow:
        issues = [i for i in uow.repo.list(Issue) if i.reference_code.startswith("SIG-2")]
        assert len(issues) >= 200
        assert len({i.title for i in issues}) >= 200
        assert len({i.created_at.date() for i in issues}) >= 100
        assert len({i.created_at.hour for i in issues}) >= 12
        assert len({(i.updated_at - i.created_at).days for i in issues}) >= 40
        action_counts, review_counts = set(), set()
        for issue in issues:
            actions = uow.repo.list(MitigationAction, issue_id=issue.id)
            reviews = uow.repo.list(RiskAssessment, issue_id=issue.id)
            action_counts.add(len(actions))
            review_counts.add(len(reviews))
            assert all(r.assessed_at >= issue.created_at for r in reviews)
            if issue.status == IssueStatus.RESOLVED:
                validate_transition(
                    IssueStatus.MITIGATED, IssueStatus.RESOLVED, actions, current_risk(uow.repo, issue.id)
                )
        assert len(action_counts) >= 4
        assert len(review_counts) >= 5
