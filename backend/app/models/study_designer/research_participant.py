from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON, UniqueConstraint
from sqlmodel import Column, Field, SQLModel


class ResearchParticipant(SQLModel, table=True):
    """
    Links a lead to a study. Cohort comes from the lead, not from
    this table. Same lead can participate in multiple studies.
    """

    __tablename__ = "research_participants"
    __table_args__ = (
        UniqueConstraint("lead_id", "study_id", name="uq_research_participant_lead_study"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    lead_id: UUID = Field(foreign_key="research_leads.id", index=True)
    study_id: UUID = Field(foreign_key="designed_studies.id", index=True)

    status: str = Field(default="PENDING")  # PENDING, READY, PROCESSING, COMPLETED, FAILED
    meta_data: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSON))

    created_at: datetime = Field(default_factory=datetime.utcnow)
