import uuid
from datetime import datetime
from typing import Optional, Dict
from sqlmodel import Field, SQLModel, Column, BigInteger
from sqlalchemy.dialects.postgresql import JSONB

class ShopifyProduct(SQLModel, table=True):
    __tablename__ = "shopify_product"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    integration_id: uuid.UUID = Field(foreign_key="integration.id", index=True)
    company_id: uuid.UUID = Field(foreign_key="company.id", index=True)
    
    shopify_product_id: int = Field(sa_column=Column(BigInteger, index=True, unique=True))
    
    title: str
    vendor: Optional[str] = None
    product_type: Optional[str] = None
    status: str = Field(default="active") # active, archived, draft
    
    # Audit fields
    created_by: str = Field(default="System")
    updated_by: str = Field(default="System")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Store the latest raw data
    raw_payload: Dict = Field(default={}, sa_column=Column(JSONB))
