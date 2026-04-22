"""add executive_summary to designed_studies

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'designed_studies',
        sa.Column('executive_summary', sa.Text(), nullable=True, server_default=''),
    )


def downgrade() -> None:
    op.drop_column('designed_studies', 'executive_summary')
