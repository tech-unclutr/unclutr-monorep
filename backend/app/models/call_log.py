from datetime import datetime
from typing import Optional, Dict
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Column as SMColumn, Text
from sqlalchemy import Column, ForeignKey, UUID as SAUUID
from sqlalchemy.dialects.postgresql import JSONB

class CallLog(SQLModel, table=True):
    __tablename__ = "call_logs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Linkages
    campaign_id: UUID = Field(sa_column=Column(SAUUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), index=True))
    lead_id: UUID = Field(sa_column=Column(SAUUID(as_uuid=True), ForeignKey("campaign_leads.id", ondelete="CASCADE"), index=True))
    
    # External Identifiers
    bolna_call_id: str = Field(index=True, unique=True)
    bolna_agent_id: str
    
    # Status & Outcome
    status: str = Field(default="initiated") # initiated, ringing, connected, completed, failed
    outcome: Optional[str] = Field(default=None) # voicemail, human, machine, etc.
    termination_reason: Optional[str] = Field(default=None)
    
    # Metrics
    duration: int = Field(default=0) # Seconds
    total_cost: float = Field(default=0.0)
    currency: str = Field(default="USD")
    
    # Content
    transcript_summary: Optional[str] = Field(default=None)
    recording_url: Optional[str] = Field(default=None)
    
    # Meta
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})
    
    # Full data dump if needed
    webhook_payload: Optional[Dict] = Field(default={}, sa_column=Column(JSONB))
