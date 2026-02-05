from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel, Text


class CampaignGoalDetail(SQLModel, table=True):
    __tablename__ = "campaigns_goals_details"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    campaign_id: UUID = Field(index=True, foreign_key="campaigns.id")
    
    # Core Bolna Identifiers
    bolna_execution_id: str = Field(index=True) # Maps to 'id' in raw JSON
    agent_id: str = Field(index=True)
    batch_id: Optional[str] = Field(default=None)
    
    # Timestamps from Bolna
    created_at: datetime
    updated_at: datetime
    scheduled_at: Optional[datetime] = Field(default=None)
    initiated_at: Optional[datetime] = Field(default=None)
    rescheduled_at: Optional[datetime] = Field(default=None)
    
    # Call Metrics
    answered_by_voice_mail: Optional[bool] = Field(default=None)
    conversation_duration: float = Field(default=0.0)
    total_cost: float = Field(default=0.0)
    status: str
    smart_status: Optional[str] = Field(default=None)
    
    # Participants
    user_number: Optional[str] = Field(default=None)
    agent_number: Optional[str] = Field(default=None)
    provider: Optional[str] = Field(default=None)
    
    # Content
    transcript: Optional[str] = Field(default=None, sa_column=Column(Text))
    summary: Optional[str] = Field(default=None, sa_column=Column(Text))
    error_message: Optional[str] = Field(default=None)
    
    # Structured Data (JSON)
    usage_breakdown: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    cost_breakdown: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    extracted_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    agent_extraction: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    custom_extractions: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    telephony_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    transfer_call_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    context_details: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    batch_run_details: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    latency_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    retry_config: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    retry_history: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    # Other Config
    workflow_retries: Optional[int] = Field(default=None)
    retry_count: int = Field(default=0)
    deleted: bool = Field(default=False)
    
    # Full Raw Data
    raw_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

    # System Timestamps
    system_created_at: datetime = Field(default_factory=datetime.utcnow)
    system_updated_at: datetime = Field(default_factory=datetime.utcnow)
