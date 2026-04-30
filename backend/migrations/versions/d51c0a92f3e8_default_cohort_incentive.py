"""default cohort incentive to 'No Incentive'

Revision ID: d51c0a92f3e8
Revises: c4a18e7d52b1
Create Date: 2026-04-30 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d51c0a92f3e8"
down_revision: Union[str, Sequence[str], None] = "c4a18e7d52b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Backfill NULL incentives, then enforce NOT NULL with a server_default."""
    op.execute(
        "UPDATE research_cohorts SET incentive = 'No Incentive' WHERE incentive IS NULL"
    )
    op.alter_column(
        "research_cohorts",
        "incentive",
        existing_type=sa.String(),
        nullable=False,
        server_default="No Incentive",
    )


def downgrade() -> None:
    """Drop the server_default and allow NULL again. Existing values are preserved."""
    op.alter_column(
        "research_cohorts",
        "incentive",
        existing_type=sa.String(),
        nullable=True,
        server_default=None,
    )
