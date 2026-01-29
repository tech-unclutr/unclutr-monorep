from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Column, Text
from sqlalchemy.dialects.postgresql import JSONB

class Campaign(SQLModel, table=True):
    __tablename__ = "campaigns"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    company_id: UUID = Field(index=True)
    user_id: str = Field(index=True)
    
    name: str = Field(nullable=False)
    status: str = Field(default="DRAFT") # INITIATED, RINGING, IN_PROGRESS, COMPLETED, FAILED, DRAFT
    
    # Bolna Execution Data
    bolna_execution_id: Optional[str] = Field(default=None, index=True, unique=True)
    bolna_agent_id: Optional[str] = Field(default=None)
    bolna_call_status: Optional[str] = Field(default=None) # completed, failed, no-answer, busy, etc.
    bolna_conversation_time: Optional[int] = Field(default=None) # Duration in seconds
    bolna_total_cost: Optional[int] = Field(default=None) # Cost in cents
    bolna_error_message: Optional[str] = Field(default=None)
    bolna_transcript: Optional[str] = Field(default=None, sa_column=Column(Text))
    bolna_extracted_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))
    bolna_telephony_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))
    bolna_raw_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB)) # Full raw webhook payload
    bolna_created_at: Optional[datetime] = Field(default=None)
    bolna_updated_at: Optional[datetime] = Field(default=None)
    
    # Team Member Info
    phone_number: Optional[str] = Field(default=None)
    team_member_role: Optional[str] = Field(default=None)
    team_member_department: Optional[str] = Field(default=None)
    
    # Legacy fields (for backward compatibility with simulation)
    decision_context: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSONB))
    
    # Quality Scoring
    quality_score: int = Field(default=0) # 0-5
    quality_gap: Optional[str] = Field(default=None) # Reason for low score
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
