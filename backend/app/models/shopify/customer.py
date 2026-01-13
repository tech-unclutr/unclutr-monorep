from datetime import datetime
from typing import Optional, Dict
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Column
from sqlalchemy import BigInteger, UniqueConstraint, ForeignKey
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

from app.models.base_mixins import UserTrackedModel

class ShopifyCustomer(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_customer"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_customer_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Context
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Identity
    shopify_customer_id: int = Field(sa_column=Column(BigInteger, index=True))
    email: Optional[str] = Field(default=None, index=True)
    first_name: Optional[str] = Field(default=None)
    last_name: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    tags: Optional[str] = Field(default=None)
    
    # Stats & Insights
    orders_count: Optional[int] = Field(default=0)
    total_spent: Optional[float] = Field(default=0.0)
    currency: Optional[str] = Field(default=None)
    last_order_id: Optional[int] = Field(default=None, sa_column=Column(BigInteger))
    
    # Status & Preferences
    state: Optional[str] = Field(default=None)
    verified_email: bool = Field(default=False)
    accepts_marketing: bool = Field(default=False)
    
    # Address Snapshot
    default_address: Optional[dict] = Field(default={}, sa_column=Column(JSONB))
    
    # Timestamps
    shopify_created_at: datetime = Field(index=True)
    shopify_updated_at: datetime = Field(index=True)
    
    # Store the latest raw data
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSONB))
