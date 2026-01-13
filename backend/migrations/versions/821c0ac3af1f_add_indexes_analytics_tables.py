"""add_indexes_analytics_tables

Revision ID: 821c0ac3af1f
Revises: dafe849d3b6d
Create Date: 2026-01-13 08:56:54.649138

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '821c0ac3af1f'
down_revision: Union[str, Sequence[str], None] = 'dafe849d3b6d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
