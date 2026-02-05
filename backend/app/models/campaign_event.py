from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel, Text


class CampaignEvent(SQLModel, table=True):
    __tablename__ = "campaign_events"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    campaign_id: UUID = Field(foreign_key="campaigns.id", index=True)
    lead_id: Optional[UUID] = Field(foreign_key="campaign_leads.id", index=True, nullable=True)
    
    # Event Types: AGENT_ACTION, THOUGHT, USER_REPLY, SYSTEM
    event_type: str = Field(index=True)
    
    message: str = Field(sa_column=Column(Text))
    agent_name: Optional[str] = Field(default=None)
    status: Optional[str] = Field(default=None)
    
    # Flexible storage for extra metadata
    data: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
