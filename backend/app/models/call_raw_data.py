from datetime import datetime
from typing import Dict
from uuid import UUID, uuid4

from sqlalchemy import JSON, ForeignKey
from sqlalchemy import UUID as SAUUID
from sqlmodel import Column, Field, SQLModel


class CallRawData(SQLModel, table=True):
    __tablename__ = "call_raw_data"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Identify the campaign
    campaign_id: UUID = Field(sa_column=Column(SAUUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), index=True))
    
    # Identify the call (indexed for easy retrieval)
    bolna_call_id: str = Field(index=True)
    
    # The Payload
    payload: Dict = Field(default={}, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
