import os
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from signal_app.domain.entities import Project, User
from signal_app.domain.enums import Role
from signal_app.infrastructure.database.repository import SqlUnitOfWork
from signal_app.main import create_app


@pytest.fixture
def database():
    url = os.getenv("TEST_DATABASE_URL", "postgresql+psycopg://signal:signal@127.0.0.1:54329/signal_test")
    parsed = make_url(url)
    if parsed.get_backend_name() != "postgresql" or not parsed.database.endswith("_test"):
        pytest.fail("Integration tests require a PostgreSQL database with a name ending in _test.")
    admin = create_engine(url)
    schema = "test_" + uuid4().hex
    with admin.begin() as connection:
        connection.execute(text(f"CREATE SCHEMA {schema}"))
    engine = create_engine(url, connect_args={"options": f"-csearch_path={schema}"})
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, "head")
    factory = sessionmaker(engine, expire_on_commit=False)
    yield engine, lambda: SqlUnitOfWork(factory)
    engine.dispose()
    with admin.begin() as connection:
        connection.execute(text(f"DROP SCHEMA {schema} CASCADE"))
    admin.dispose()


@pytest.fixture
def populated(database):
    _, factory = database
    now = datetime.now(UTC)
    people = [
        User(uuid4(), name, f"{i}@example.test", role, "#A78BFA", now)
        for i, (name, role) in enumerate([("Emma Wilson", Role.MANAGER), ("Daniel Reed", Role.MEMBER)])
    ]
    project = Project(uuid4(), "Digital Operations", "DOP", "Operations", "ACTIVE", people[0].id, now)
    with factory() as uow:
        for person in people:
            uow.repo.add(person)
        uow.repo.add(project)
    return people, project


@pytest.fixture
def client(database, populated):
    app = create_app(database[1], demo_mode=True)
    app.state.engine = database[0]
    with TestClient(app) as client:
        client.headers["X-Demo-User"] = str(populated[0][0].id)
        yield client


@pytest.fixture
def users(client):
    return client.get("/api/v1/users").json()


@pytest.fixture
def project(client):
    return client.get("/api/v1/projects").json()[0]
