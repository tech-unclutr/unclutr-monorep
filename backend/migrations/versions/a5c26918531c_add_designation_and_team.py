"""Add designation and team

Revision ID: a5c26918531c
Revises: 55187f9c3a04
Create Date: 2026-01-30 01:14:33.079159

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'a5c26918531c'
down_revision: Union[str, Sequence[str], None] = '55187f9c3a04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("user", sa.Column("designation", sa.String(), nullable=True))
    op.add_column("user", sa.Column("team", sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("user", "designation")
    op.drop_column("user", "team")
