"""add_user_queue_tracking_to_call_logs

Revision ID: feda60103f24
Revises: 
Create Date: 2026-02-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'feda60103f24'
down_revision: Union[str, None] = '890c99c7c677'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to call_logs table
    op.add_column('call_logs', sa.Column('copied_to_user_queue', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('call_logs', sa.Column('copied_to_queue_at', sa.DateTime(), nullable=True))
    op.add_column('call_logs', sa.Column('user_queue_item_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_call_logs_user_queue_item_id',
        'call_logs',
        'queue_items',
        ['user_queue_item_id'],
        ['id'],
        ondelete='SET NULL'
    )
    
    # Add index for faster lookups
    op.create_index('ix_call_logs_copied_to_user_queue', 'call_logs', ['copied_to_user_queue'])


def downgrade() -> None:
    # Remove index
    op.drop_index('ix_call_logs_copied_to_user_queue', table_name='call_logs')
    
    # Remove foreign key constraint
    op.drop_constraint('fk_call_logs_user_queue_item_id', 'call_logs', type_='foreignkey')
    
    # Remove columns
    op.drop_column('call_logs', 'user_queue_item_id')
    op.drop_column('call_logs', 'copied_to_queue_at')
    op.drop_column('call_logs', 'copied_to_user_queue')
