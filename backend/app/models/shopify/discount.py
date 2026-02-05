from datetime import datetime
from typing import Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlmodel import BigInteger, Column, Field, SQLModel

from app.models.base_mixins import UserTrackedModel


class ShopifyPriceRule(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_price_rule"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_price_rule_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Shopify Identity
    shopify_price_rule_id: int = Field(sa_column=Column(BigInteger, index=True, nullable=False))
    
    # Details
    title: str = Field(index=True)
    value_type: str = Field(index=True) # fixed_amount, percentage
    value: float
    
    target_type: str = Field(index=True) # line_item, shipping_line
    target_selection: str = Field(index=True) # all, entitled
    allocation_method: str = Field(index=True) # each, across
    
    # Constraints
    usage_limit: Optional[int] = None
    once_per_customer: bool = Field(default=False)
    
    # Timestamps
    starts_at: datetime = Field(index=True)
    ends_at: Optional[datetime] = Field(default=None, index=True)
    shopify_created_at: datetime = Field(index=True)
    shopify_updated_at: datetime = Field(index=True)
    
    # Store the latest raw data
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSON))

class ShopifyDiscountCode(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_discount_code"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_discount_code_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Parent Price Rule
    price_rule_id: UUID = Field(sa_column=Column(ForeignKey("shopify_price_rule.id", ondelete="CASCADE"), index=True, nullable=False))
    shopify_price_rule_id: int = Field(sa_column=Column(BigInteger, index=True))
    
    # Shopify Identity
    shopify_discount_code_id: int = Field(sa_column=Column(BigInteger, index=True, nullable=False))
    
    # Details
    code: str = Field(index=True)
    usage_count: int = Field(default=0)
    
    # Timestamps
    shopify_created_at: datetime = Field(index=True)
    shopify_updated_at: datetime = Field(index=True)
    
    # Store the latest raw data
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSON))
