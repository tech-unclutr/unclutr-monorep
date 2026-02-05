from datetime import datetime
from decimal import Decimal
from typing import Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlmodel import BigInteger, Column, Field, SQLModel

from app.models.base_mixins import UserTrackedModel


class ShopifyLocation(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_location"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_location_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    shopify_location_id: int = Field(sa_column=Column(BigInteger, index=True, nullable=False))
    
    name: str = Field(index=True)
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    zip: Optional[str] = None
    province: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    
    active: bool = Field(default=True)
    is_primary: bool = Field(default=False)
    
    # Timestamps
    shopify_created_at: Optional[datetime] = Field(default=None, index=True)
    shopify_updated_at: Optional[datetime] = Field(default=None, index=True)
    
    # Store the latest raw data
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSON))

class ShopifyInventoryItem(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_inventory_item"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_inventory_item_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    shopify_inventory_item_id: int = Field(sa_column=Column(BigInteger, index=True, nullable=False))
    
    sku: Optional[str] = Field(default=None, index=True)
    tracked: bool = Field(default=True)
    cost: Optional[Decimal] = Field(default=None, max_digits=20, decimal_places=2)
    
    requires_shipping: bool = Field(default=True)
    
    # Store the latest raw data
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSON))

class ShopifyInventoryLevel(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_inventory_level"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    shopify_inventory_item_id: int = Field(sa_column=Column(BigInteger, index=True, nullable=False))
    shopify_location_id: int = Field(sa_column=Column(BigInteger, index=True, nullable=False))
    
    available: int = Field(default=0)
    
    shopify_updated_at: Optional[datetime] = Field(default=None, index=True)
    
    # Store the latest raw data
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSON))
