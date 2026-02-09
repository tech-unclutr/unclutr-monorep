from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON, Text
from sqlmodel import Column, Field, SQLModel


class CallLog(SQLModel, table=True):
    __tablename__ = "call_logs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    campaign_id: UUID = Field(foreign_key="campaigns.id", index=True)
    lead_id: UUID = Field(foreign_key="campaign_leads.id", index=True)
    
    # External Bolna Call ID
    bolna_call_id: str = Field(index=True, unique=True)
    bolna_agent_id: str = Field(index=True, default="unknown")
    
    # Call Metadata
    status: str = Field(default="initiated")  # initiated, completed, failed, etc.
    outcome: Optional[str] = Field(default=None)  # interested, not_interested, voicemail, etc.
    duration: int = Field(default=0)  # seconds
    
    # Cost Tracking
    total_cost: float = Field(default=0.0)
    currency: str = Field(default="USD")
    
    # Telephony
    # telephony_provider: Optional[str] = Field(default=None)  # TODO: Add migration for this column
    termination_reason: Optional[str] = Field(default=None)
    
    # Recording & Transcript
    recording_url: Optional[str] = Field(default=None)
    transcript_summary: Optional[str] = Field(default=None, sa_column=Column(Text))
    full_transcript: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # Raw webhook payload for debugging
    webhook_payload: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSON))
    
    # [NEW] User Queue Copy Tracking
    copied_to_user_queue: bool = Field(default=False)
    copied_to_queue_at: Optional[datetime] = Field(default=None)
    user_queue_item_id: Optional[UUID] = Field(default=None, foreign_key="queue_items.id")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})
