"""add contacts table and contact_id to campaign_leads

Revision ID: a1b2c3d4e5f6
Revises: 3f4e5d6c7b8a
Create Date: 2026-02-27 00:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '3f4e5d6c7b8a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create contacts table
    op.create_table(
        'contacts',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False, index=True),
        
        # Person
        sa.Column('first_name', sa.String(), nullable=True),
        sa.Column('last_name', sa.String(), nullable=True),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('linkedin_url', sa.String(), nullable=True),
        
        # Company
        sa.Column('company_name', sa.String(), nullable=True),
        sa.Column('industry', sa.String(), nullable=True),
        sa.Column('employee_count', sa.String(), nullable=True),
        
        # Contact
        sa.Column('primary_phone', sa.String(), nullable=False, index=True),
        sa.Column('alt_phone', sa.String(), nullable=True),
        
        # Location
        sa.Column('city', sa.String(), nullable=True),
        sa.Column('country', sa.String(), nullable=True),
        
        # Flexible overflow
        sa.Column('custom_fields', postgresql.JSONB(astext_type=sa.Text()), 
                  server_default='{}', nullable=True),
        
        # Metadata
        sa.Column('source', sa.String(), server_default='csv_upload', nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        
        # Unique constraint
        sa.UniqueConstraint('company_id', 'primary_phone', name='uq_company_contact_phone'),
    )
    
    # 2. Add contact_id to campaign_leads (nullable FK)
    op.add_column(
        'campaign_leads',
        sa.Column('contact_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.create_foreign_key(
        'fk_campaign_leads_contact_id',
        'campaign_leads', 'contacts',
        ['contact_id'], ['id']
    )
    op.create_index('ix_campaign_leads_contact_id', 'campaign_leads', ['contact_id'])


def downgrade() -> None:
    # Remove FK and column from campaign_leads
    op.drop_index('ix_campaign_leads_contact_id', table_name='campaign_leads')
    op.drop_constraint('fk_campaign_leads_contact_id', 'campaign_leads', type_='foreignkey')
    op.drop_column('campaign_leads', 'contact_id')
    
    # Drop contacts table
    op.drop_table('contacts')
