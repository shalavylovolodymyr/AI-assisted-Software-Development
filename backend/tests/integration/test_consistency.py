from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError

from signal_app.application.services import TransitionIssue
from signal_app.domain.entities import AuditEvent, Issue, RiskAssessment
from signal_app.domain.enums import IssueStatus
from signal_app.domain.exceptions import Conflict
from signal_app.seed import seed

from .test_workflow import create_issue


def test_real_transaction_rollback_and_foreign_keys(client, users, project, database):
    issue = create_issue(client, users, project)
    factory = database[1]
    with factory() as uow:
        before = uow.repo.list(AuditEvent)
    with pytest.raises(RuntimeError):
        with factory() as uow:
            record = uow.repo.get(Issue, uuid4())
            assert record is None
            existing = uow.repo.list(Issue)[0]
            existing.title = "Must roll back"
            uow.repo.save(existing)
            raise RuntimeError("Abort multi-step workflow")
    assert client.get("/api/v1/issues/" + issue["id"]).json()["title"] != "Must roll back"
    with factory() as uow:
        existing = uow.repo.list(RiskAssessment)[0]
    with pytest.raises(IntegrityError), factory() as uow:
        uow.repo.add(replace(existing, id=uuid4(), issue_id=uuid4()))
    with factory() as uow:
        assert len(uow.repo.list(AuditEvent)) == len(before)
        assert len(uow.repo.list(RiskAssessment)) == 1


def test_parent_lock_and_version_prevent_duplicate_transitions(client, users, project, database):
    issue = create_issue(client, users, project)
    from uuid import UUID

    def transition():
        try:
            TransitionIssue(database[1]).execute(
                UUID(issue["id"]), UUID(users[0]["id"]), 1, IssueStatus.IN_PROGRESS
            )
            return "ok"
        except Conflict:
            return "stale"

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(lambda _: transition(), range(2)))
    assert sorted(results) == ["ok", "stale"]
    detail = client.get("/api/v1/issues/" + issue["id"]).json()
    assert detail["version"] == 2
    assert len([e for e in detail["activity"] if e["event_type"] == "STATUS_CHANGED"]) == 1


def test_seed_is_idempotent_and_resolved_records_obey_invariants(database):
    from signal_app.application.services import current_risk
    from signal_app.domain.entities import MitigationAction, User
    from signal_app.domain.rules import validate_transition

    factory = database[1]
    assert seed(factory) is True
    assert seed(factory) is False
    with factory() as uow:
        assert len(uow.repo.list(User)) == 6
        issues = uow.repo.list(Issue)
        assert len(issues) == 24
        assert 35 <= len(uow.repo.list(RiskAssessment)) <= 45
        for issue in issues:
            if issue.status == IssueStatus.RESOLVED:
                validate_transition(
                    IssueStatus.MITIGATED,
                    IssueStatus.RESOLVED,
                    uow.repo.list(MitigationAction, issue_id=issue.id),
                    current_risk(uow.repo, issue.id),
                )
                assert issue.resolved_at


def test_migration_roundtrip(database):
    from pathlib import Path

    config = Config(str(Path(__file__).parents[2] / "alembic.ini"))
    with database[0].begin() as connection:
        config.attributes["connection"] = connection
        assert "issues" in inspect(connection).get_table_names()
        command.downgrade(config, "base")
        assert "issues" not in inspect(connection).get_table_names()
        command.upgrade(config, "head")
        assert "risk_assessments" in inspect(connection).get_table_names()
