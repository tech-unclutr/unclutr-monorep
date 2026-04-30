from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON, ForeignKey, UniqueConstraint
from sqlmodel import Column, Field, SQLModel


class ResearchCohort(SQLModel, table=True):
    """
    Independent cohort entity, company-scoped.
    Cohorts are defined at the lead level — a lead belongs to a cohort.
    """

    __tablename__ = "research_cohorts"
    __table_args__ = (
        UniqueConstraint("company_id", "name", name="uq_research_cohort_company_name"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    company_id: UUID = Field(index=True)

    name: str = Field(nullable=False)
    description: Optional[str] = Field(default=None)
    hypothesis: Optional[str] = Field(default=None)
    incentive: str = Field(default="No Incentive", nullable=False)

    agent_configuration_id: Optional[UUID] = Field(
        default=None,
        sa_column=Column(
            ForeignKey("agent_configurations.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
    )

    meta_data: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
