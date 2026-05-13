"""drop interview_type and cohort_interview_map

Revision ID: 7ce4f7160c89
Revises: 0038e2b18dc1
Create Date: 2026-05-02 00:00:00.000000

Collapses the per-(lead × interview_duration) execution model down to
per-(lead × cohort). One queue row per lead per cohort.

Existing rows in study_call_logs / study_call_queue / study_executions
are wiped — the model is in active development and these are test data.
The CASCADE only fans into study_call_queue and study_call_logs (FKs into
study_executions); no other tables reference these.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7ce4f7160c89"
down_revision: Union[str, Sequence[str], None] = "0038e2b18dc1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "TRUNCATE study_call_logs, study_call_queue, study_executions CASCADE"
    )
    op.drop_column("study_call_queue", "interview_type")
    op.drop_column("study_executions", "cohort_interview_map")


def downgrade() -> None:
    op.add_column(
        "study_executions",
        sa.Column(
            "cohort_interview_map",
            sa.JSON(),
            nullable=True,
        ),
    )
    op.add_column(
        "study_call_queue",
        sa.Column("interview_type", sa.Integer(), nullable=True),
    )
