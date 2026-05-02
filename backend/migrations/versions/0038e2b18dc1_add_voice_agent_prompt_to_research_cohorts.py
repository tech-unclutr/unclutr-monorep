"""add voice_agent_prompt to research_cohorts

Revision ID: 0038e2b18dc1
Revises: 76b5ee4de3e1
Create Date: 2026-05-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0038e2b18dc1"
down_revision: Union[str, Sequence[str], None] = "76b5ee4de3e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add nullable voice_agent_prompt + voice_agent_prompt_generated_at columns to research_cohorts.

    Both default to NULL. Existing rows are not backfilled — generation
    happens on first read of the design-screen endpoint.
    """
    op.add_column(
        "research_cohorts",
        sa.Column("voice_agent_prompt", sa.Text(), nullable=True),
    )
    op.add_column(
        "research_cohorts",
        sa.Column(
            "voice_agent_prompt_generated_at",
            sa.DateTime(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("research_cohorts", "voice_agent_prompt_generated_at")
    op.drop_column("research_cohorts", "voice_agent_prompt")
