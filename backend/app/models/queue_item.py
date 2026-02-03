from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel

class QueueItem(SQLModel, table=True):
    __tablename__ = "queue_items"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    campaign_id: UUID = Field(foreign_key="campaigns.id", index=True)
    lead_id: UUID = Field(foreign_key="campaign_leads.id", index=True)
    
    # Status Tracking
    # ELIGIBLE, DIALING_INTENT, INTENT_YES_PENDING, INTENT_NO, READY, LOCKED, CONSUMED, FAILED, SCHEDULED, PENDING_AVAILABILITY
    status: str = Field(default="ELIGIBLE", index=True)
    outcome: Optional[str] = Field(default=None) # Success, Failure Reason, etc.
    
    # Sorting & Priority
    priority_score: int = Field(default=0)
    cohort_id: Optional[UUID] = Field(foreign_key="cohorts.id", default=None)
    
    # Dynamic Scheduling
    scheduled_for: Optional[datetime] = Field(default=None, index=True) # specific callback time
    
    # Locking for "Next 2"
    locked_by_user_id: Optional[UUID] = Field(default=None)
    locked_at: Optional[datetime] = Field(default=None)
    
    # Telemetry
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    execution_count: int = Field(default=0) # How many times have we tried to verify intent?
