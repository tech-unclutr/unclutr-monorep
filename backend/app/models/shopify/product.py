from datetime import datetime
from typing import Optional, Dict, List
from uuid import UUID, uuid4
from decimal import Decimal
from sqlmodel import Field, SQLModel, Column, BigInteger, Relationship
from sqlalchemy import UniqueConstraint, ForeignKey
from sqlalchemy.dialects import postgresql

from app.models.base_mixins import UserTrackedModel

class ShopifyProduct(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_product"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_product_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    shopify_product_id: int = Field(sa_column=Column(BigInteger, index=True, nullable=False))
    
    title: str = Field(index=True)
    handle: Optional[str] = Field(default=None, index=True)
    vendor: Optional[str] = Field(default=None, index=True)
    product_type: Optional[str] = Field(default=None, index=True)
    status: str = Field(default="active", index=True) # active, archived, draft
    
    body_html: Optional[str] = Field(default=None)
    tags: Optional[str] = Field(default=None) # Comma separated
    published_at: Optional[datetime] = Field(default=None, index=True)
    
    # Timestamps
    shopify_created_at: datetime = Field(index=True)
    shopify_updated_at: datetime = Field(index=True)
    
    # Store the latest raw data
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSONB))

    # Relationships
    variants: List["ShopifyProductVariant"] = Relationship(back_populates="product", sa_relationship_kwargs={"cascade": "all, delete"})
    images: List["ShopifyProductImage"] = Relationship(back_populates="product", sa_relationship_kwargs={"cascade": "all, delete"})

class ShopifyProductVariant(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_product_variant"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_variant_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    product_id: UUID = Field(foreign_key="shopify_product.id", index=True, nullable=False)
    
    shopify_variant_id: int = Field(sa_column=Column(BigInteger, index=True, nullable=False))
    shopify_inventory_item_id: Optional[int] = Field(sa_column=Column(BigInteger, index=True))
    
    title: str = Field(index=True)
    sku: Optional[str] = Field(default=None, index=True)
    barcode: Optional[str] = Field(default=None, index=True)
    
    price: Decimal = Field(default=0, max_digits=20, decimal_places=2)
    compare_at_price: Optional[Decimal] = Field(default=None, max_digits=20, decimal_places=2)
    
    weight: Optional[Decimal] = Field(default=0, max_digits=20, decimal_places=2)
    weight_unit: Optional[str] = Field(default="kg")
    
    inventory_management: Optional[str] = Field(default="shopify")
    inventory_policy: Optional[str] = Field(default="deny")
    inventory_quantity: Optional[int] = Field(default=0)
    
    # Timestamps
    shopify_created_at: Optional[datetime] = Field(default=None, index=True)
    shopify_updated_at: Optional[datetime] = Field(default=None, index=True)
    
    # Store the latest raw data
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSONB))
    
    # Relationships
    product: ShopifyProduct = Relationship(back_populates="variants")

class ShopifyProductImage(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_product_image"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_image_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    product_id: UUID = Field(foreign_key="shopify_product.id", index=True, nullable=False)
    
    shopify_image_id: int = Field(sa_column=Column(BigInteger, index=True, nullable=False))
    
    src: str
    alt: Optional[str] = None
    position: int = Field(default=1)
    width: Optional[int] = Field(default=None)
    height: Optional[int] = Field(default=None)
    
    # Timestamps
    shopify_created_at: Optional[datetime] = Field(default=None, index=True)
    shopify_updated_at: Optional[datetime] = Field(default=None, index=True)
    
    # Store the latest raw data
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSONB))
    
    # Relationships
    product: ShopifyProduct = Relationship(back_populates="images")
