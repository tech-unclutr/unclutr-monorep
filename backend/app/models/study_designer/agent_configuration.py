from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, Enum as SAEnum, Index, text
from sqlmodel import Field, SQLModel, UniqueConstraint


class VoiceProvider(str, Enum):
    BOLNA = "bolna"


class AgentConfiguration(SQLModel, table=True):
    """
    Reusable execution-agent identity (name, voice, language), company-scoped.

    A company can maintain multiple personas (e.g. "Riya" for D2C consumer
    studies, "Jordan" for B2B founder calls). Each cohort references one via
    `research_cohorts.agent_configuration_id`. The runtime resolution chain is
    cohort.agent_configuration_id -> company default -> hardcoded fallback,
    so deleting an agent never breaks a cohort's call path.
    """

    __tablename__ = "agent_configurations"
    __table_args__ = (
        UniqueConstraint(
            "company_id", "name", name="uq_agent_configuration_company_name"
        ),
        Index(
            "uq_agent_configuration_company_default",
            "company_id",
            unique=True,
            postgresql_where=text("is_default = true"),
        ),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    company_id: UUID = Field(index=True)

    name: str = Field(nullable=False, max_length=64)
    display_name: Optional[str] = Field(default=None, max_length=128)
    description: Optional[str] = Field(default=None, max_length=500)

    voice_id: str = Field(nullable=False)
    voice_provider: VoiceProvider = Field(
        default=VoiceProvider.BOLNA,
        sa_column=Column(
            SAEnum(
                VoiceProvider,
                name="voiceprovider",
                values_callable=lambda enum_cls: [e.value for e in enum_cls],
            ),
            nullable=False,
        ),
    )
    language: str = Field(default="en-IN")

    is_default: bool = Field(default=False)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = Field(default=None)
