"""relax study_call_logs legacy fks

Revision ID: a1b2c3d4e5f6
Revises: 7ce4f7160c89
Create Date: 2026-05-12 00:00:00.000000

The new agent-execution flow inserts into `study_call_logs` per call but no
longer populates `execution_id` or `queue_item_id` (the StudyExecution /
StudyCallQueue Python models are gone). Drop NOT NULL on those two columns
so the new flow can write rows. The columns themselves stay — webhook code
that may still reference them is unaffected.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "7ce4f7160c89"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "study_call_logs",
        "execution_id",
        existing_type=sa.Uuid(),
        nullable=True,
    )
    op.alter_column(
        "study_call_logs",
        "queue_item_id",
        existing_type=sa.Uuid(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "study_call_logs",
        "queue_item_id",
        existing_type=sa.Uuid(),
        nullable=False,
    )
    op.alter_column(
        "study_call_logs",
        "execution_id",
        existing_type=sa.Uuid(),
        nullable=False,
    )
