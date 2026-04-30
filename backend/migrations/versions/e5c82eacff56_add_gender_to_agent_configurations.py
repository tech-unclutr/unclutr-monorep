"""add gender to agent configurations

Revision ID: e5c82eacff56
Revises: d51c0a92f3e8
Create Date: 2026-04-30 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5c82eacff56"
down_revision: Union[str, Sequence[str], None] = "d51c0a92f3e8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


GENDER_ENUM = sa.Enum("female", "male", "neutral", name="agentgender")


def upgrade() -> None:
    """Add `gender` column with NOT NULL DEFAULT 'female' (backfills existing rows)."""
    GENDER_ENUM.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "agent_configurations",
        sa.Column(
            "gender",
            GENDER_ENUM,
            nullable=False,
            server_default="female",
        ),
    )


def downgrade() -> None:
    """Drop the column and the enum type."""
    op.drop_column("agent_configurations", "gender")
    GENDER_ENUM.drop(op.get_bind(), checkfirst=True)
