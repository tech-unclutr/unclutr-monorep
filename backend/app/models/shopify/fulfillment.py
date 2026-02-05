from datetime import datetime
from typing import Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlmodel import BigInteger, Column, Field, SQLModel

from app.models.base_mixins import UserTrackedModel


class ShopifyFulfillment(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_fulfillment"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_fulfillment_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Parent Order
    order_id: UUID = Field(sa_column=Column(ForeignKey("shopify_order.id", ondelete="CASCADE"), index=True, nullable=False))
    shopify_order_id: int = Field(sa_column=Column(BigInteger, index=True))

    # Shopify Identity
    shopify_fulfillment_id: int = Field(sa_column=Column(BigInteger, index=True, nullable=False))
    
    # Details
    status: str = Field(index=True) # pending, open, success, cancelled, error, failure
    shipment_status: Optional[str] = Field(default=None, index=True) # label_printed, label_purchased, label_voided, in_transit, out_for_delivery, delivered, etc.
    location_id: Optional[int] = Field(default=None, sa_column=Column(BigInteger))
    
    tracking_company: Optional[str] = None
    tracking_number: Optional[str] = Field(default=None, index=True)
    tracking_url: Optional[str] = None
    
    # Timestamps
    shopify_created_at: datetime = Field(index=True)
    shopify_updated_at: datetime = Field(index=True)
    
    # Store the latest raw data
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSON))
