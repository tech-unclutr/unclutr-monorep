from typing import Optional, Dict
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Column
from sqlalchemy import BigInteger, UniqueConstraint, ForeignKey

from sqlalchemy.dialects import postgresql
from app.models.base_mixins import UserTrackedModel

class ShopifyAddress(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_address"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_address_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Context
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Relationships
    shopify_customer_id: int = Field(sa_column=Column(BigInteger, index=True, nullable=False))
    customer_id: Optional[UUID] = Field(sa_column=Column(ForeignKey("shopify_customer.id", ondelete="CASCADE"), index=True))
    
    # Identity
    shopify_address_id: int = Field(sa_column=Column(BigInteger, index=True, nullable=False))
    
    # Data
    first_name: Optional[str] = Field(default=None)
    last_name: Optional[str] = Field(default=None)
    company: Optional[str] = Field(default=None)
    address1: Optional[str] = Field(default=None)
    address2: Optional[str] = Field(default=None)
    city: Optional[str] = Field(default=None)
    province: Optional[str] = Field(default=None)
    country: Optional[str] = Field(default=None)
    zip: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    name: Optional[str] = Field(default=None)
    province_code: Optional[str] = Field(default=None)
    country_code: Optional[str] = Field(default=None)
    country_name: Optional[str] = Field(default=None)
    default: bool = Field(default=False)

    # Store the latest raw data
    raw_payload: Optional[Dict] = Field(default={}, sa_column=Column(postgresql.JSONB))
