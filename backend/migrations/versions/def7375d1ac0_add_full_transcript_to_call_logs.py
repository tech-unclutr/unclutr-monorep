"""add_full_transcript_to_call_logs

Revision ID: def7375d1ac0
Revises: feda60103f24
Create Date: 2026-02-05 04:35:06.283936

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'def7375d1ac0'
down_revision: Union[str, Sequence[str], None] = 'feda60103f24'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add full_transcript column to call_logs table
    op.add_column('call_logs', sa.Column('full_transcript', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove full_transcript column from call_logs table
    op.drop_column('call_logs', 'full_transcript')
