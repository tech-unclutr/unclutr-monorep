from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel, UniqueConstraint


class CampaignLead(SQLModel, table=True):
    __tablename__ = "campaign_leads"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    campaign_id: UUID = Field(foreign_key="campaigns.id", index=True)
    
    customer_name: str = Field(nullable=False)
    contact_number: str = Field(nullable=False)
    cohort: Optional[str] = Field(default=None)
    
    status: str = Field(default="PENDING") # PENDING, PROCESSED, FAILED
    
    meta_data: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("campaign_id", "contact_number", name="unique_campaign_lead_phone"),
    )
