from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class InterviewSession(SQLModel, table=True):
    __tablename__ = "interview_sessions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    company_id: UUID = Field(index=True)
    user_id: str = Field(index=True)
    
    status: str = Field(default="SCHEDULED") # SCHEDULED, IN_PROGRESS, COMPLETED, FAILED
    
    # For now, we store the full transcript here. 
    # In a real Bolna integration, this might be a URL or a large text blob.
    transcript: Optional[str] = Field(default=None)
    
    # Metadata from Bolna (call_id, agent_id, etc.)
    metadata_info: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
