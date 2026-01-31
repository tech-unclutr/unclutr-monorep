from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Column
from sqlalchemy.dialects.postgresql import JSONB

class ArchivedCampaignLead(SQLModel, table=True):
    __tablename__ = "archived_campaign_leads"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    original_campaign_id: UUID = Field(index=True)
    campaign_name: str = Field(nullable=False)
    
    customer_name: str = Field(nullable=False)
    contact_number: str = Field(nullable=False)
    cohort: Optional[str] = Field(default=None)
    
    meta_data: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSONB))
    
    created_at: datetime = Field(description="Original creation time")
    archived_at: datetime = Field(default_factory=datetime.utcnow)
