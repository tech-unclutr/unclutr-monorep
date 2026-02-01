"""rename_call_duration_limit_to_call_duration

Revision ID: ee58e4042691
Revises: cda687106a3c
Create Date: 2026-02-01 01:47:31.501333

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'ee58e4042691'
down_revision: Union[str, Sequence[str], None] = 'cda687106a3c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('campaigns', 'call_duration_limit', new_column_name='call_duration')
    op.alter_column('archived_campaigns', 'call_duration_limit', new_column_name='call_duration')


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('campaigns', 'call_duration', new_column_name='call_duration_limit')
    op.alter_column('archived_campaigns', 'call_duration', new_column_name='call_duration_limit')
