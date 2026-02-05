from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel, Column, JSON


class UserQueueItem(SQLModel, table=True):
    """
    Represents a lead in the user action queue (yes-intent leads ready for human follow-up).
    These are leads that AI agents have identified as high-intent and need human interaction.
    """
    __tablename__ = "user_queue_items"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    campaign_id: UUID = Field(foreign_key="campaigns.id", index=True)
    lead_id: UUID = Field(foreign_key="campaign_leads.id", index=True)
    original_queue_item_id: UUID = Field(foreign_key="queue_items.id", index=True)
    
    # AI Call Context (from AI agent interactions)
    call_history: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    ai_summary: Optional[str] = Field(default=None)  # 2-line summary of why they're interested
    intent_strength: float = Field(default=0.0)  # 0.0 to 1.0
    
    # Commitment Tracking
    confirmation_slot: Optional[datetime] = Field(default=None)  # When customer committed to callback
    detected_at: datetime = Field(default_factory=datetime.utcnow)  # When yes-intent was detected
    
    # User Action Tracking
    user_call_count: int = Field(default=0)  # Number of times user has called this lead
    last_user_call_at: Optional[datetime] = Field(default=None)
    user_call_status: Optional[str] = Field(default=None)  # Last call status
    
    # Retry Tracking
    retry_count: int = Field(default=0)
    max_retries: int = Field(default=3)
    retry_scheduled_for: Optional[datetime] = Field(default=None)
    
    # Status: READY, LOCKED, RESCHEDULED, CLOSED
    status: str = Field(default="READY", index=True)
    
    # Closure Tracking
    closed_at: Optional[datetime] = Field(default=None)
    closure_reason: Optional[str] = Field(default=None)  # WON, LOST, UNREACHABLE
    
    # Locking (for concurrent access control)
    locked_by_user_id: Optional[str] = Field(default=None)  # Firebase UID (string)
    locked_at: Optional[datetime] = Field(default=None)
    lock_expires_at: Optional[datetime] = Field(default=None)
    
    # Priority (for dynamic sorting)
    priority_score: int = Field(default=0, index=True)
    
    # User Preferences (extracted from AI calls)
    user_preferences: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
