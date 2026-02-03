"""add_unique_constraint_queue_items

Revision ID: 960ff26fa58e
Revises: d0544daa046c
Create Date: 2026-02-03 08:53:07.326981

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '960ff26fa58e'
down_revision: Union[str, Sequence[str], None] = 'd0544daa046c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add unique constraint to prevent duplicate lead entries within a single campaign
    op.create_unique_constraint('uq_queue_items_campaign_lead', 'queue_items', ['campaign_id', 'lead_id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Remove unique constraint
    op.drop_constraint('uq_queue_items_campaign_lead', 'queue_items', type_='unique')
