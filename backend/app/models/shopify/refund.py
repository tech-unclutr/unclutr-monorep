from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Column
from sqlalchemy import BigInteger, DECIMAL
from sqlalchemy.dialects.postgresql import JSONB

from app.models.base_mixins import UserTrackedModel

class ShopifyRefund(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_refund"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Context
    integration_id: UUID = Field(foreign_key="integration.id", index=True, nullable=False)
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Relationships
    order_id: UUID = Field(foreign_key="shopify_order.id", index=True, nullable=False)
    
    # Identity
    shopify_refund_id: int = Field(sa_column=Column(BigInteger, unique=True, index=True))
    shopify_order_id: int = Field(sa_column=Column(BigInteger, index=True))
    
    # Details
    note: Optional[str] = Field(default=None)
    restock: bool = Field(default=False)
    
    # Snapshot of items refunded (simplified)
    # [{"line_item_id": 123, "quantity": 1, "restock_type": "return"}]
    refund_line_items: List[dict] = Field(default=[], sa_column=Column(JSONB))
    
    # Timestamps
    processed_at: datetime = Field(index=True)
