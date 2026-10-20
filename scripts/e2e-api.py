"""Serve E2E against a fresh, disposable schema in an explicitly named test DB."""

import os
from pathlib import Path
from uuid import uuid4

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

base_url = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://signal:signal@127.0.0.1:54329/signal_test",
)
url = make_url(base_url)
if url.get_backend_name() != "postgresql" or not url.database.endswith("_test"):
    raise SystemExit("E2E requires a PostgreSQL database whose name ends in _test.")
schema = "test_e2e_" + uuid4().hex
admin = create_engine(base_url)
with admin.begin() as connection:
    connection.execute(text(f"CREATE SCHEMA {schema}"))
isolated = url.update_query_dict({"options": "-csearch_path=" + schema})
os.environ["DATABASE_URL"] = isolated.render_as_string(hide_password=False)
os.environ["DEMO_MODE"] = "true"

import uvicorn  # noqa: E402

from signal_app.infrastructure.database.repository import make_uow  # noqa: E402
from signal_app.main import app  # noqa: E402
from signal_app.seed import seed, seed_history  # noqa: E402

engine, factory = make_uow(os.environ["DATABASE_URL"])
try:
    cfg = Config(str(Path(__file__).parents[1] / "backend/alembic.ini"))
    with engine.begin() as connection:
        cfg.attributes["connection"] = connection
        command.upgrade(cfg, "head")
    seed(factory)
    seed_history(factory)
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="warning")
finally:
    engine.dispose()
    app.state.engine.dispose()
    with admin.begin() as connection:
        connection.execute(text(f"DROP SCHEMA {schema} CASCADE"))
    admin.dispose()
