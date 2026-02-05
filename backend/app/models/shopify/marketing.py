from datetime import datetime
from typing import Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlmodel import BigInteger, Column, Field, SQLModel

from app.models.base_mixins import UserTrackedModel


class ShopifyMarketingEvent(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_marketing_event"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_marketing_event_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Shopify Identity
    shopify_marketing_event_id: int = Field(sa_column=Column(BigInteger, index=True, nullable=False))
    
    # Details
    type: str = Field(index=True) # ad, post, email, etc.
    description: Optional[str] = None
    marketing_channel: Optional[str] = Field(default=None, index=True) # search, social, etc.
    paid: bool = Field(default=False)
    
    manage_url: Optional[str] = None
    preview_url: Optional[str] = None
    
    # Timestamps
    started_at: Optional[datetime] = Field(default=None, index=True)
    ended_at: Optional[datetime] = Field(default=None, index=True)
    scheduled_to_end_at: Optional[datetime] = None
    
    # Store the latest raw data
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSON))
