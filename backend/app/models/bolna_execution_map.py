from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Column, Text
from sqlalchemy.dialects.postgresql import JSONB

class BolnaExecutionMap(SQLModel, table=True):
    __tablename__ = "bolna_execution_maps"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    queue_item_id: UUID = Field(foreign_key="queue_items.id", index=True)
    campaign_id: UUID = Field(foreign_key="campaigns.id", index=True)
    
    # External Bolna Logic
    bolna_call_id: str = Field(index=True)
    bolna_agent_id: str
    
    call_status: str = Field(default="initiated") # initiated, ringing, connected, completed, failed
    call_outcome: Optional[str] = Field(default=None) # voicemail, human, machine
    
    # Detailed data
    transcript_summary: Optional[str] = Field(default=None)
    full_transcript: Optional[str] = Field(default=None)
    
    # Observability & Custom Analytics
    total_cost: float = Field(default=0.0)
    currency: str = Field(default="USD")
    call_duration: int = Field(default=0) # Seconds
    transcript: Optional[str] = Field(default=None, sa_column=Column(Text))
    extracted_data: Optional[Dict] = Field(default={}, sa_column=Column(JSONB)) # Focused extraction
    telephony_provider: Optional[str] = Field(default=None)
    termination_reason: Optional[str] = Field(default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})
    
    # Raw webhook data for debugging
    last_webhook_payload: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSONB))
