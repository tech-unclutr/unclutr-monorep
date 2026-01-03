"""rename_datasource_request_to_all_requests

Revision ID: c86ba245112d
Revises: 38df4628b925
Create Date: 2026-01-03 17:06:44.051281

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c86ba245112d'
down_revision: Union[str, Sequence[str], None] = '38df4628b925'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Rename table
    op.rename_table('data_source_request', 'all_requests')
    
    # Create RequestType enum
    # We need to handle this carefully for Postgres
    request_type_enum = postgresql.ENUM('DATASOURCE', 'WORKSPACE_DELETION', name='requesttype')
    request_type_enum.create(op.get_bind())
    
    # Add new columns
    op.add_column('all_requests', sa.Column('request_type', sa.Enum('DATASOURCE', 'WORKSPACE_DELETION', name='requesttype'), nullable=False, server_default='DATASOURCE'))
    op.add_column('all_requests', sa.Column('payload', sa.JSON(), nullable=True))
    
    # Fix indexes (renaming them for consistency, though not strictly required, generic names are better)
    # Drop old indexes
    op.drop_index('ix_data_source_request_name', table_name='all_requests')
    op.drop_index('ix_data_source_request_user_id', table_name='all_requests')
    
    # Create new indexes
    op.create_index(op.f('ix_all_requests_name'), 'all_requests', ['name'], unique=False)
    op.create_index(op.f('ix_all_requests_user_id'), 'all_requests', ['user_id'], unique=False)
    op.create_index(op.f('ix_all_requests_request_type'), 'all_requests', ['request_type'], unique=False)
    
    # Alter default for request_type to remove server_default if we don't want it permanently (optional, leaving it is fine)
    op.alter_column('all_requests', 'request_type', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.drop_index(op.f('ix_all_requests_request_type'), table_name='all_requests')
    op.drop_index(op.f('ix_all_requests_user_id'), table_name='all_requests')
    op.drop_index(op.f('ix_all_requests_name'), table_name='all_requests')
    
    # Drop columns
    op.drop_column('all_requests', 'payload')
    op.drop_column('all_requests', 'request_type')
    
    # Drop Enum
    request_type_enum = postgresql.ENUM('DATASOURCE', 'WORKSPACE_DELETION', name='requesttype')
    request_type_enum.drop(op.get_bind())

    # Rename table back
    op.rename_table('all_requests', 'data_source_request')
    
    # Recreate old indexes
    op.create_index('ix_data_source_request_user_id', 'data_source_request', ['user_id'], unique=False)
    op.create_index('ix_data_source_request_name', 'data_source_request', ['name'], unique=False)
