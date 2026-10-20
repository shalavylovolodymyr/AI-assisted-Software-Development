"""Add nullable removal timestamps; retain all existing records and history."""

import sqlalchemy as sa
from alembic import op

revision = "9b6e81f0d523"
down_revision = "3cded7a58a89"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("issues", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("mitigation_actions", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column("mitigation_actions", "deleted_at")
    op.drop_column("issues", "deleted_at")
