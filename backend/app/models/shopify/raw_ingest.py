from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, JSON, Column
from sqlalchemy import BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID

from app.models.base_mixins import UserTrackedModel

class ShopifyRawIngest(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "shopify_raw_ingest"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Context
    integration_id: UUID = Field(sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("integration.id", ondelete="CASCADE"), index=True, nullable=False))
    company_id: UUID = Field(foreign_key="company.id", index=True, nullable=False)
    
    # Payload Identity
    object_type: str = Field(index=True) # order, product, customer
    shopify_object_id: Optional[int] = Field(sa_column=Column(BigInteger, index=True, nullable=True)) # The ID from Shopify
    shopify_updated_at: Optional[datetime] = Field(default=None, index=True) # For determining latest version
    
    # Deduplication & Integrity
    dedupe_key: str = Field(index=True) # SHA256 of raw bytes or specific fields
    dedupe_hash_canonical: str = Field(index=True) # SHA256 of sorted/canonical JSON
    
    # Source Tracking
    source: str = Field(default="backfill") # backfill, webhook, reconciliation
    topic: Optional[str] = Field(default=None) # orders/create, orders/updated
    api_version: str = Field(default="2024-01")
    
    # Data - Stored as JSONB for efficient querying
    headers: Dict[str, Any] = Field(default={}, sa_column=Column(JSONB))
    payload: Dict[str, Any] = Field(default={}, sa_column=Column(JSONB))
    
    # Status
    hmac_valid: bool = Field(default=False)
    processing_status: str = Field(default="pending", index=True) # pending, processed, failed, skipped
    error_message: Optional[str] = Field(default=None)
    
    # Analysis
    diff_summary: Dict[str, Any] = Field(default={}, sa_column=Column(JSONB)) # Stores computed changes (e.g. price_old vs price_new)
    
    # Timestamps
    fetched_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = Field(default=None)

    class Config:
        arbitrary_types_allowed = True
