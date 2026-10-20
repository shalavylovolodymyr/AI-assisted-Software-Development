from alembic import context
from sqlalchemy import create_engine

from signal_app.infrastructure.config import DATABASE_URL
from signal_app.infrastructure.database.models import Base

config = context.config
target_metadata = Base.metadata


def run(connection):
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    context.configure(url=DATABASE_URL, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()
elif config.attributes.get("connection") is not None:
    run(config.attributes["connection"])
else:
    with create_engine(DATABASE_URL).connect() as connection:
        run(connection)
