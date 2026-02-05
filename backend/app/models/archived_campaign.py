from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel, Text


class ArchivedCampaign(SQLModel, table=True):
    __tablename__ = "archived_campaigns"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    original_campaign_id: UUID = Field(index=True)
    company_id: UUID = Field(index=True)
    user_id: str = Field(index=True)
    
    name: str = Field(nullable=False)
    status: str = Field(default="DRAFT")
    
    # Bolna Execution Data
    # source_file_hash: Optional[str] = Field(default=None)
    # bolna_execution_id: Optional[str] = Field(default=None)
    # bolna_agent_id: Optional[str] = Field(default=None)
    # bolna_call_status: Optional[str] = Field(default=None)
    # bolna_conversation_time: Optional[int] = Field(default=None)
    # bolna_total_cost: Optional[int] = Field(default=None)
    # bolna_error_message: Optional[str] = Field(default=None)
    # bolna_transcript: Optional[str] = Field(default=None, sa_column=Column(Text))
    # bolna_extracted_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    # bolna_telephony_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    # bolna_raw_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    # bolna_created_at: Optional[datetime] = Field(default=None)
    # bolna_updated_at: Optional[datetime] = Field(default=None)
    
    # Legacy fields
    decision_context: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSON))
    
    # Quality Scoring
    quality_score: int = Field(default=0)
    quality_gap: Optional[str] = Field(default=None)
    
    # Context Fields
    brand_context: Optional[str] = Field(default=None, sa_column=Column(Text))
    customer_context: Optional[str] = Field(default=None, sa_column=Column(Text))
    team_member_context: Optional[str] = Field(default=None, sa_column=Column(Text))
    preliminary_questions: Optional[List[str]] = Field(default=[], sa_column=Column(JSON))
    question_bank: Optional[List[str]] = Field(default=[], sa_column=Column(JSON))
    incentive_bank: Optional[List[str]] = Field(default=[], sa_column=Column(JSON))
    cohort_questions: Optional[Dict[str, List[str]]] = Field(default={}, sa_column=Column(JSON))
    cohort_incentives: Optional[Dict[str, str]] = Field(default={}, sa_column=Column(JSON))
    incentive: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # Execution Settings
    total_call_target: Optional[int] = Field(default=None)
    call_duration: Optional[int] = Field(default=600)
    cohort_config: Optional[Dict[str, int]] = Field(default={}, sa_column=Column(JSON))
    selected_cohorts: Optional[List[str]] = Field(default=[], sa_column=Column(JSON))
    execution_windows: Optional[List[Dict[str, Any]]] = Field(default=[], sa_column=Column(JSON))
    cohort_data: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSON))
    
    # Associated Data
    goal_details: Optional[List[Dict[str, Any]]] = Field(default=[], sa_column=Column(JSON))
    
    original_created_at: datetime = Field(description="Original creation time")
    original_updated_at: datetime = Field(description="Original last update time")
    archived_at: datetime = Field(default_factory=datetime.utcnow)
