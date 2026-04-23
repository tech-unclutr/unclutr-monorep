from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON, UniqueConstraint
from sqlmodel import Column, Field, SQLModel


class ResearchLead(SQLModel, table=True):
    """
    Independent lead entity. A person who can participate in multiple studies.
    Belongs to a cohort. Company-scoped, deduplicated by contact_number.
    """

    __tablename__ = "research_leads"
    __table_args__ = (
        UniqueConstraint("company_id", "contact_number", name="uq_research_lead_company_phone"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    company_id: UUID = Field(index=True)
    cohort_id: Optional[UUID] = Field(default=None, foreign_key="research_cohorts.id", index=True)

    first_name: str = Field(nullable=False)
    last_name: Optional[str] = Field(default=None)
    contact_number: str = Field(nullable=False)
    contact_profile: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSON))
    # ^ first_name, email, company_name, linkedin_url, job_title, etc.

    status: str = Field(default="ACTIVE")  # ACTIVE, ARCHIVED
    meta_data: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSON))

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
