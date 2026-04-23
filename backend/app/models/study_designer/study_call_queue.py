from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class StudyCallQueue(SQLModel, table=True):
    """
    One row per (lead × interview_type) to be called.
    A single lead in a cohort mapped to [15, 60] produces two rows.
    """

    __tablename__ = "study_call_queue"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    execution_id: UUID = Field(foreign_key="study_executions.id", index=True)
    participant_id: UUID = Field(foreign_key="research_participants.id")
    lead_id: UUID = Field(foreign_key="research_leads.id", index=True)

    interview_type: int = Field()  # 15 | 30 | 60
    cohort_name: str = Field()
    prompt_text: Optional[str] = Field(default=None)
    # Full execution prompt with study variables baked in.
    # Runtime vars ({participant_name}, {agent_name}) still as placeholders.

    status: str = Field(default="PENDING", index=True)
    # PENDING → READY → DIALING → [terminal]
    # Terminal: COMPLETED, INTENT_YES, INTENT_NO, DNC, WRONG_PERSON,
    #           VOICEMAIL, NO_ANSWER, BUSY, HANGUP, SILENCE, LANGUAGE_BARRIER,
    #           FAILED_CONNECT, FAX_ROBOT, AMBIGUOUS, DISCONNECTED, SCHEDULED

    execution_count: int = Field(default=0)
    priority_score: int = Field(default=0)
    outcome: Optional[str] = Field(default=None)
    scheduled_for: Optional[datetime] = Field(default=None)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
