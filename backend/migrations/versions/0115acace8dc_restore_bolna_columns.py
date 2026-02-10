"""restore_bolna_columns

Revision ID: 0115acace8dc
Revises: 26e1892bc588
Create Date: 2026-02-10 03:32:19.631671

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '0115acace8dc'
down_revision: Union[str, Sequence[str], None] = '26e1892bc588'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c['name'] for c in inspector.get_columns('campaigns')]

    if 'bolna_execution_id' not in columns:
        op.add_column('campaigns', sa.Column('bolna_execution_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        op.create_index(op.f('ix_campaigns_bolna_execution_id'), 'campaigns', ['bolna_execution_id'], unique=True)
    
    if 'bolna_agent_id' not in columns:
        op.add_column('campaigns', sa.Column('bolna_agent_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    
    if 'bolna_call_status' not in columns:
        op.add_column('campaigns', sa.Column('bolna_call_status', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    
    if 'bolna_conversation_time' not in columns:
        op.add_column('campaigns', sa.Column('bolna_conversation_time', sa.Integer(), nullable=True))
    
    if 'bolna_total_cost' not in columns:
        op.add_column('campaigns', sa.Column('bolna_total_cost', sa.Float(), nullable=True))
    
    if 'bolna_error_message' not in columns:
        op.add_column('campaigns', sa.Column('bolna_error_message', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    
    if 'bolna_transcript' not in columns:
        op.add_column('campaigns', sa.Column('bolna_transcript', sa.Text(), nullable=True))
    
    if 'bolna_extracted_data' not in columns:
        op.add_column('campaigns', sa.Column('bolna_extracted_data', sa.JSON(), nullable=True))
    
    if 'bolna_telephony_data' not in columns:
        op.add_column('campaigns', sa.Column('bolna_telephony_data', sa.JSON(), nullable=True))
    
    if 'bolna_raw_data' not in columns:
        op.add_column('campaigns', sa.Column('bolna_raw_data', sa.JSON(), nullable=True))
    
    if 'bolna_created_at' not in columns:
        op.add_column('campaigns', sa.Column('bolna_created_at', sa.DateTime(), nullable=True))
    
    if 'bolna_updated_at' not in columns:
        op.add_column('campaigns', sa.Column('bolna_updated_at', sa.DateTime(), nullable=True))
    
    if 'source_file_hash' not in columns:
        op.add_column('campaigns', sa.Column('source_file_hash', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        op.create_index(op.f('ix_campaigns_source_file_hash'), 'campaigns', ['source_file_hash'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_campaigns_source_file_hash'), table_name='campaigns')
    op.drop_index(op.f('ix_campaigns_bolna_execution_id'), table_name='campaigns')
    op.drop_column('campaigns', 'source_file_hash')
    op.drop_column('campaigns', 'bolna_updated_at')
    op.drop_column('campaigns', 'bolna_created_at')
    op.drop_column('campaigns', 'bolna_raw_data')
    op.drop_column('campaigns', 'bolna_telephony_data')
    op.drop_column('campaigns', 'bolna_extracted_data')
    op.drop_column('campaigns', 'bolna_transcript')
    op.drop_column('campaigns', 'bolna_error_message')
    op.drop_column('campaigns', 'bolna_total_cost')
    op.drop_column('campaigns', 'bolna_conversation_time')
    op.drop_column('campaigns', 'bolna_call_status')
    op.drop_column('campaigns', 'bolna_agent_id')
    op.drop_column('campaigns', 'bolna_execution_id')
