from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class StudyCallLog(SQLModel, table=True):
    """
    Bolna call log for a research lead.

    Maps to the existing `study_call_logs` table (created by the initial
    schema migration). The legacy `queue_item_id` column is kept on the
    table but treated as Optional here — the new agent-execution flow
    doesn't populate it.
    """

    __tablename__ = "study_call_logs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    queue_item_id: Optional[UUID] = Field(default=None, index=True)
    study_id: Optional[UUID] = Field(
        default=None, foreign_key="designed_studies.id", index=True
    )
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

    # Phase 1 — insights pipeline.
    # `company_id` is denormalized from research_leads.company_id so tenant
    # queries against study_call_logs are local (no join). Nullable to allow
    # the migration to land without a backfill; flip to NOT NULL in a later
    # cleanup once every new row sets it.
    company_id: Optional[UUID] = Field(default=None, index=True)
    # `gs://...` URL once the transcript has been stashed. Stays NULL when
    # the call has no transcript, when study_id/company_id are missing, or
    # when the GCS upload failed and the fail-soft path was taken.
    transcript_gcs_path: Optional[str] = Field(default=None)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
