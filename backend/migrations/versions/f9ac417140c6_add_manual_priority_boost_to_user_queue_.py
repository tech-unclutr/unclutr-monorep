"""Add manual_priority_boost to user_queue_items

Revision ID: f9ac417140c6
Revises: 37c628d74c2d
Create Date: 2026-02-07 12:46:14.422920

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f9ac417140c6'
down_revision: Union[str, Sequence[str], None] = '37c628d74c2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('user_queue_items', sa.Column('manual_priority_boost', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('user_queue_items', 'manual_priority_boost')
