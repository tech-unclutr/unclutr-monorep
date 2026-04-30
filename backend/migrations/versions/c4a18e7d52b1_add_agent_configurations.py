"""add agent configurations

Revision ID: c4a18e7d52b1
Revises: b137d3aa4b5d
Create Date: 2026-04-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = "c4a18e7d52b1"
down_revision: Union[str, Sequence[str], None] = "b137d3aa4b5d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


VOICE_PROVIDER_ENUM = sa.Enum("bolna", name="voiceprovider")


def upgrade() -> None:
    """Upgrade schema."""
    # gen_random_uuid() is built-in on Postgres 13+, but pgcrypto provides it
    # on older versions and is a no-op on newer ones.
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    VOICE_PROVIDER_ENUM.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "agent_configurations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(length=64), nullable=False),
        sa.Column("display_name", sqlmodel.sql.sqltypes.AutoString(length=128), nullable=True),
        sa.Column("description", sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column("voice_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("voice_provider", VOICE_PROVIDER_ENUM, nullable=False, server_default="bolna"),
        sa.Column("language", sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default="en-IN"),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("created_by", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "name", name="uq_agent_configuration_company_name"),
    )
    op.create_index(
        op.f("ix_agent_configurations_company_id"),
        "agent_configurations",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "uq_agent_configuration_company_default",
        "agent_configurations",
        ["company_id"],
        unique=True,
        postgresql_where=sa.text("is_default = true"),
    )

    op.add_column(
        "research_cohorts",
        sa.Column("agent_configuration_id", sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        "fk_research_cohorts_agent_configuration",
        "research_cohorts",
        "agent_configurations",
        ["agent_configuration_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        op.f("ix_research_cohorts_agent_configuration_id"),
        "research_cohorts",
        ["agent_configuration_id"],
        unique=False,
    )

    op.execute(
        """
        INSERT INTO agent_configurations (
            id, company_id, name, display_name, description,
            voice_id, voice_provider, language, is_default,
            created_at, updated_at
        )
        SELECT
            gen_random_uuid(),
            c.id,
            'Aditi',
            'Aditi — Default',
            'Auto-created default agent. Update name, voice, or language via the API.',
            'default',
            'bolna',
            'en-IN',
            true,
            NOW(),
            NOW()
        FROM company c
        ON CONFLICT (company_id, name) DO NOTHING
        """
    )

    op.execute(
        """
        UPDATE research_cohorts rc
        SET agent_configuration_id = ac.id
        FROM agent_configurations ac
        WHERE ac.company_id = rc.company_id
          AND ac.is_default = true
          AND rc.agent_configuration_id IS NULL
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_research_cohorts_agent_configuration_id"),
        table_name="research_cohorts",
    )
    op.drop_constraint(
        "fk_research_cohorts_agent_configuration",
        "research_cohorts",
        type_="foreignkey",
    )
    op.drop_column("research_cohorts", "agent_configuration_id")

    op.drop_index(
        "uq_agent_configuration_company_default",
        table_name="agent_configurations",
    )
    op.drop_index(
        op.f("ix_agent_configurations_company_id"),
        table_name="agent_configurations",
    )
    op.drop_table("agent_configurations")

    VOICE_PROVIDER_ENUM.drop(op.get_bind(), checkfirst=True)
