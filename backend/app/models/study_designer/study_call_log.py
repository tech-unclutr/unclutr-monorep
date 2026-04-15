from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class StudyCallLog(SQLModel, table=True):
    """
    One row per Bolna API call attempt. A queue item with 2 attempts
    produces 2 call log rows. The webhook updates these rows.
    """

    __tablename__ = "study_call_logs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    queue_item_id: UUID = Field(foreign_key="study_call_queue.id", index=True)
    execution_id: UUID = Field(foreign_key="study_executions.id", index=True)
    lead_id: UUID = Field(foreign_key="research_leads.id")

    bolna_call_id: str = Field(index=True, sa_column_kwargs={"unique": True})
    bolna_agent_id: str = Field()

    call_status: str = Field(default="initiated")
    # initiated → ringing → connected → completed/failed/no-answer/busy/canceled

    call_outcome: Optional[str] = Field(default=None)
    # Terminal: INTENT_YES, INTENT_NO, VOICEMAIL, NO_ANSWER, etc.

    call_duration: int = Field(default=0)  # seconds
    total_cost: float = Field(default=0.0)
    currency: str = Field(default="USD")

    transcript_summary: Optional[str] = Field(default=None)
    full_transcript: Optional[str] = Field(default=None)
    extracted_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    termination_reason: Optional[str] = Field(default=None)
    recording_url: Optional[str] = Field(default=None)

    webhook_payload: Optional[Dict[str, Any]] = Field(
        default={}, sa_column=Column(JSON)
    )

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
