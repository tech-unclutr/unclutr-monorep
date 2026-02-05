from datetime import datetime
from decimal import Decimal
from typing import Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlmodel import BigInteger, Column, Field, SQLModel

from app.models.base_mixins import UserTrackedModel


class ShopifyCheckout(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_checkout"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_checkout_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Shopify Identity
    shopify_checkout_id: int = Field(sa_column=Column(BigInteger, index=True, nullable=False))
    token: str = Field(index=True)
    cart_token: Optional[str] = Field(default=None, index=True)
    
    # Details
    email: Optional[str] = Field(default=None, index=True)
    abandoned_checkout_url: Optional[str] = None
    
    # Financials
    subtotal_price: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    total_price: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    total_tax: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    currency: str = Field(default="USD")
    
    # Timestamps
    shopify_created_at: datetime = Field(index=True)
    shopify_updated_at: datetime = Field(index=True)
    shopify_completed_at: Optional[datetime] = Field(default=None, index=True)
    
    # Store the latest raw data
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSON))
