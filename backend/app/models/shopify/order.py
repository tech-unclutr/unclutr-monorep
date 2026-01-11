from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4
from decimal import Decimal
from sqlmodel import Field, SQLModel, Relationship, Column
from sqlalchemy import BigInteger

from app.models.base_mixins import UserTrackedModel

class ShopifyOrder(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_order"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Context
    integration_id: UUID = Field(foreign_key="integration.id", index=True, nullable=False)
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Shopify Identity
    shopify_order_id: int = Field(sa_column=Column(BigInteger, unique=True, index=True))
    shopify_order_number: int = Field(index=True)
    shopify_name: str = Field(index=True) # e.g. #1001
    
    # Status
    financial_status: str = Field(index=True) # paid, pending, refund
    fulfillment_status: Optional[str] = Field(default=None, index=True) # fulfilled, null
    
    # Financials
    total_price: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    subtotal_price: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    total_tax: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    total_discounts: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    refunded_subtotal: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    refunded_tax: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    currency: str = Field(default="USD")
    
    # Customer
    customer_id: Optional[UUID] = Field(default=None, foreign_key="shopify_customer.id", nullable=True)
    email: Optional[str] = Field(default=None, index=True)
    
    # Timestamps
    shopify_created_at: datetime = Field(index=True)
    shopify_updated_at: datetime = Field(index=True)
    shopify_processed_at: Optional[datetime] = Field(default=None)
    shopify_closed_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    line_items: List["ShopifyLineItem"] = Relationship(back_populates="order", sa_relationship_kwargs={"cascade": "all, delete"})

class ShopifyLineItem(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_line_item"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Context
    integration_id: UUID = Field(foreign_key="integration.id", index=True, nullable=False)
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Parent
    order_id: UUID = Field(foreign_key="shopify_order.id", index=True, nullable=False)
    
    # Identity
    shopify_line_item_id: int = Field(sa_column=Column(BigInteger, index=True))
    
    # Details
    product_id: Optional[int] = Field(default=None, sa_column=Column(BigInteger, index=True))
    variant_id: Optional[int] = Field(default=None, sa_column=Column(BigInteger, index=True))
    sku: Optional[str] = Field(default=None, index=True)
    title: str
    variant_title: Optional[str] = Field(default=None)
    vendor: Optional[str] = Field(default=None)
    
    # Quantity & Price
    quantity: int
    price: Decimal = Field(max_digits=20, decimal_places=2)
    total_discount: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    
    # Relationship
    order: ShopifyOrder = Relationship(back_populates="line_items")

# Forward reference for Customer if needed later
# class ShopifyCustomer(...) 
