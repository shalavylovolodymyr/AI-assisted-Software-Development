"""Explicitly destructive reset for a dedicated local demo database only."""

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url

from signal_app.infrastructure.config import DATABASE_URL, DEMO_MODE
from signal_app.infrastructure.database.repository import make_uow
from signal_app.seed import seed, seed_history

url = make_url(DATABASE_URL)
if (
    not DEMO_MODE
    or url.host not in ("127.0.0.1", "localhost")
    or url.database != "signal"
):
    raise SystemExit(
        "Reset is restricted to the local signal demo database with DEMO_MODE=true."
    )
if (
    input(
        "This permanently removes ALL local SIGNAL data. Type RESET SIGNAL to confirm: "
    )
    != "RESET SIGNAL"
):
    raise SystemExit("Reset cancelled. No data changed.")
cfg = Config("backend/alembic.ini")
engine = create_engine(DATABASE_URL)
with engine.begin() as connection:
    cfg.attributes["connection"] = connection
    command.downgrade(cfg, "base")
    command.upgrade(cfg, "head")
_, factory = make_uow(DATABASE_URL)
seed(factory)
seed_history(factory)
print("Local demo reset and seeded.")
