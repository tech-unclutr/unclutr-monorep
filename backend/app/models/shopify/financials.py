from datetime import datetime
from decimal import Decimal
from typing import Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import BigInteger, ForeignKey, UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlmodel import Column, Field, SQLModel

from app.models.base_mixins import UserTrackedModel


class ShopifyPayout(UserTrackedModel, SQLModel, table=True):
    """
    Shopify Payments Payout.
    Represents a transfer from Shopify to the merchant's bank account.
    """
    __tablename__ = "shopify_payout"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_payout_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    shopify_payout_id: int = Field(sa_column=Column(BigInteger, index=True))
    date: datetime = Field(index=True)
    currency: str = Field(default="USD")
    amount: Decimal = Field(default=0, max_digits=12, decimal_places=2)
    status: str = Field(index=True) # e.g. paid, failed, scheduled
    
    processed_at: Optional[datetime] = Field(default=None)
    
    # Summary of transactions included (optional purely for aggregation, real mapping via join)
    summary: Optional[Dict] = Field(default=None, sa_column=Column(postgresql.JSON)) 
    
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSON))

class ShopifyDispute(UserTrackedModel, SQLModel, table=True):
    """
    Shopify Payments Dispute (Chargeback).
    """
    __tablename__ = "shopify_dispute"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_dispute_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    shopify_dispute_id: int = Field(sa_column=Column(BigInteger, index=True))
    order_id: Optional[int] = Field(sa_column=Column(BigInteger, index=True)) # Shopify Order ID link
    
    type: str = Field(index=True) # chargeback, inquiry
    amount: Decimal = Field(default=0, max_digits=12, decimal_places=2)
    currency: str = Field(default="USD")
    reason: str = Field(default="unknown")
    status: str = Field(index=True) # needs_response, lost, won, under_review
    
    evidence_due_by: Optional[datetime] = Field(default=None)
    evidence_sent_on: Optional[datetime] = Field(default=None)
    finalized_on: Optional[datetime] = Field(default=None)
    
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSON))

class ShopifyBalanceTransaction(UserTrackedModel, SQLModel, table=True):
    """
    Granular balance transaction (ledger) from Shopify Payments.
    Links Payouts to source transactions (Orders/Refunds).
    """
    __tablename__ = "shopify_balance_transaction"
    __table_args__ = (UniqueConstraint("integration_id", "shopify_transaction_id"),) # This ID is different from Order Transaction ID

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    integration_id: UUID = Field(sa_column=Column(ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    shopify_transaction_id: int = Field(sa_column=Column(BigInteger, index=True))
    payout_id: Optional[UUID] = Field(foreign_key="shopify_payout.id", nullable=True)
    shopify_payout_id: Optional[int] = Field(sa_column=Column(BigInteger, index=True))

    type: str = Field(index=True) # charge, refund, dispute, payout, adjustment
    test: bool = Field(default=False)
    
    amount: Decimal = Field(default=0)
    currency: str = Field(default="USD")
    fee: Decimal = Field(default=0)
    net: Decimal = Field(default=0)
    
    source_id: Optional[int] = Field(sa_column=Column(BigInteger)) # Order ID or other source
    source_type: Optional[str] = Field()
    
    processed_at: datetime = Field(index=True)
    
    raw_payload: Dict = Field(default={}, sa_column=Column(postgresql.JSON))
