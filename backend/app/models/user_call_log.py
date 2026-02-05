from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class UserCallLog(SQLModel, table=True):
    """
    Logs every call attempt made by a human user to a lead in the user queue.
    Tracks outcomes, next actions, and retry scheduling.
    """
    __tablename__ = "user_call_logs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_queue_item_id: UUID = Field(foreign_key="user_queue_items.id", index=True)
    lead_id: UUID = Field(foreign_key="campaign_leads.id", index=True)
    campaign_id: UUID = Field(foreign_key="campaigns.id", index=True)
    user_id: str = Field(foreign_key="user.id", index=True)  # Firebase UID (string)
    
    # Call Outcome
    # CONNECTED, VOICEMAIL, NO_ANSWER, BUSY, NOT_INTERESTED, WRONG_PERSON
    status: str = Field(index=True)
    
    # Next Action
    # RETRY_NOW, RETRY_SCHEDULED, CLOSE_WON, CLOSE_LOST, NONE
    next_action: Optional[str] = Field(default=None)
    
    # Call Details
    duration: Optional[int] = Field(default=None)  # Duration in seconds
    notes: Optional[str] = Field(default=None)  # User's notes about the call
    
    # Retry Scheduling (if next_action is RETRY_SCHEDULED)
    retry_scheduled_for: Optional[datetime] = Field(default=None)
    
    # Timestamp
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
