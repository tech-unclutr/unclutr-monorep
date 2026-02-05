from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import JSON, Column, Field, SQLModel


class CalendarConnection(SQLModel, table=True):
    __tablename__ = "calendar_connection"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    company_id: UUID = Field(index=True)
    user_id: str = Field(index=True)
    provider: str = Field(default="google") # "google", "outlook", etc.
    
    # Store tokens in metadata_info using JSON for flexibility and safety
    # In a real-world prod app, individual tokens should be encrypted.
    # For this implementation, we will store them as a JSON structure.
    credentials: dict = Field(default_factory=dict, sa_column=Column(JSON))
    
    status: str = Field(default="active")
    expiry: Optional[datetime] = None
    last_synced_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
