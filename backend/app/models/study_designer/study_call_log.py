from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class StudyCallLog(SQLModel, table=True):
    """
    Bolna call log for a research lead.

    Maps to the existing `study_call_logs` table (created by the initial
    schema migration). The legacy `execution_id` and `queue_item_id`
    columns are kept on the table but treated as Optional here — the
    new agent-execution flow doesn't populate them. DB-level NOT NULL
    on those columns is handled outside this model (migration pending).
    """

    __tablename__ = "study_call_logs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    queue_item_id: Optional[UUID] = Field(default=None, index=True)
    execution_id: Optional[UUID] = Field(default=None, index=True)
    lead_id: UUID = Field(foreign_key="research_leads.id", nullable=False)

    bolna_call_id: str = Field(nullable=False, index=True)
    bolna_agent_id: str = Field(nullable=False)
    call_status: str = Field(nullable=False)
    call_outcome: Optional[str] = Field(default=None)
    call_duration: int = Field(default=0)
    total_cost: float = Field(default=0.0)
    currency: str = Field(default="USD")
    transcript_summary: Optional[str] = Field(default=None)
    full_transcript: Optional[str] = Field(default=None)
    extracted_data: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column(JSON)
    )
    termination_reason: Optional[str] = Field(default=None)
    recording_url: Optional[str] = Field(default=None)
    webhook_payload: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column(JSON)
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
