from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Column
from sqlalchemy.dialects.postgresql import JSONB

class CampaignLead(SQLModel, table=True):
    __tablename__ = "campaign_leads"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    campaign_id: UUID = Field(foreign_key="campaigns.id", index=True)
    
    customer_name: str = Field(nullable=False)
    contact_number: str = Field(nullable=False)
    cohort: Optional[str] = Field(default=None)
    
    status: str = Field(default="PENDING") # PENDING, PROCESSED, FAILED
    
    meta_data: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSONB))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
