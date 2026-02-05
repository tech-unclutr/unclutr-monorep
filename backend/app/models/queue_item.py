from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class QueueItem(SQLModel, table=True):
    __tablename__ = "queue_items"
    __table_args__ = (
        UniqueConstraint("campaign_id", "lead_id", name="uq_campaign_lead_queue"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    campaign_id: UUID = Field(foreign_key="campaigns.id", index=True)
    lead_id: UUID = Field(foreign_key="campaign_leads.id", index=True)
    
    # Status Tracking
    # ELIGIBLE, DIALING_INTENT, INTENT_YES_PENDING, INTENT_NO, READY, LOCKED, CONSUMED, FAILED, SCHEDULED, PENDING_AVAILABILITY
    status: str = Field(default="ELIGIBLE", index=True)
    outcome: Optional[str] = Field(default=None) # [NEW] Descriptive outcome (e.g. "Wrong Contact", "Language Mismatch")
    
    # Sorting & Priority
    priority_score: int = Field(default=0)
    cohort_id: Optional[UUID] = Field(foreign_key="cohorts.id", default=None)
    
    # Dynamic Scheduling
    scheduled_for: Optional[datetime] = Field(default=None, index=True) # specific callback time
    
    # Locking for "Next 2"
    locked_by_user_id: Optional[UUID] = Field(default=None)
    locked_at: Optional[datetime] = Field(default=None)
    
    # User Queue Promotion Tracking
    promoted_to_user_queue: bool = Field(default=False)
    promoted_at: Optional[datetime] = Field(default=None)
    
    # Closure Tracking (for all drop-off points)
    closure_reason: Optional[str] = Field(default=None)  # DNC, WRONG_PERSON, NO_INTENT, MAX_RETRIES_AI, FAILED, etc.
    
    # Telemetry
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    execution_count: int = Field(default=0) # How many times have we tried to verify intent?
