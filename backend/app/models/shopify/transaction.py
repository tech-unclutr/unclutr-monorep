from datetime import datetime
from typing import Optional, Dict
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Column
from sqlalchemy import BigInteger, DECIMAL, ForeignKey
from sqlalchemy.dialects import postgresql

from app.models.base_mixins import UserTrackedModel

class ShopifyTransaction(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_transaction"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Context
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Relationships
    order_id: UUID = Field(sa_column=Column(ForeignKey("shopify_order.id", ondelete="CASCADE"), index=True, nullable=False))
    
    # Identity
    shopify_transaction_id: int = Field(sa_column=Column(BigInteger, unique=True, index=True))
    shopify_order_id: int = Field(sa_column=Column(BigInteger, index=True))
    parent_id: Optional[int] = Field(default=None, sa_column=Column(BigInteger))
    
    # Financials
    amount: float = Field(sa_column=Column(DECIMAL(10, 2)))
    currency: str = Field(index=True)
    
    # Type & Status
    kind: str = Field(index=True)  # sale, refund, capture, void, authorization
    status: str = Field(index=True) # success, pending, failure, error
    gateway: Optional[str] = Field(default=None)
    
    # Metadata
    authorization: Optional[str] = Field(default=None)
    error_code: Optional[str] = Field(default=None)
    message: Optional[str] = Field(default=None)
    
    # Timestamps
    shopify_processed_at: datetime = Field(index=True)

    # Store the latest raw data
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSONB))
