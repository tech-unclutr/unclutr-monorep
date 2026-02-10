"""add structured_context to user_queue_items

Revision ID: 3f4e5d6c7b8a
Revises: 0115acace8dc
Create Date: 2026-02-10 05:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3f4e5d6c7b8a'
down_revision: Union[str, None] = '0115acace8dc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add structured_context column to user_queue_items table
    op.add_column('user_queue_items', sa.Column('structured_context', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    # Remove structured_context column from user_queue_items table
    op.drop_column('user_queue_items', 'structured_context')
