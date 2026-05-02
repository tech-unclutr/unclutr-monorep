"""add conversation_language to agent configurations

Revision ID: 76b5ee4de3e1
Revises: e5c82eacff56
Create Date: 2026-05-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "76b5ee4de3e1"
down_revision: Union[str, Sequence[str], None] = "e5c82eacff56"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


CONVERSATION_LANGUAGE_ENUM = sa.Enum(
    "english_only",
    "english_default_switch_on_request",
    "mirror_user",
    "bilingual_pre_written",
    name="conversationlanguage",
)


def upgrade() -> None:
    """Add `conversation_language` column with NOT NULL DEFAULT 'english_only' (backfills existing rows)."""
    CONVERSATION_LANGUAGE_ENUM.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "agent_configurations",
        sa.Column(
            "conversation_language",
            CONVERSATION_LANGUAGE_ENUM,
            nullable=False,
            server_default="english_only",
        ),
    )


def downgrade() -> None:
    """Drop the column and the enum type."""
    op.drop_column("agent_configurations", "conversation_language")
    CONVERSATION_LANGUAGE_ENUM.drop(op.get_bind(), checkfirst=True)
