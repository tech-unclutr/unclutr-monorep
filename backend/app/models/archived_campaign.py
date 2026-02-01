from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Column, Text
from sqlalchemy.dialects.postgresql import JSONB

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
    # bolna_extracted_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))
    # bolna_telephony_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))
    # bolna_raw_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))
    # bolna_created_at: Optional[datetime] = Field(default=None)
    # bolna_updated_at: Optional[datetime] = Field(default=None)
    
    # Team Member Info
    phone_number: Optional[str] = Field(default=None)
    team_member_role: Optional[str] = Field(default=None)
    team_member_department: Optional[str] = Field(default=None)
    
    # Legacy fields
    decision_context: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSONB))
    
    # Quality Scoring
    quality_score: int = Field(default=0)
    quality_gap: Optional[str] = Field(default=None)
    
    # Context Fields
    brand_context: Optional[str] = Field(default=None, sa_column=Column(Text))
    customer_context: Optional[str] = Field(default=None, sa_column=Column(Text))
    team_member_context: Optional[str] = Field(default=None, sa_column=Column(Text))
    preliminary_questions: Optional[List[str]] = Field(default=[], sa_column=Column(JSONB))
    question_bank: Optional[List[str]] = Field(default=[], sa_column=Column(JSONB))
    incentive_bank: Optional[List[str]] = Field(default=[], sa_column=Column(JSONB))
    cohort_questions: Optional[Dict[str, List[str]]] = Field(default={}, sa_column=Column(JSONB))
    cohort_incentives: Optional[Dict[str, str]] = Field(default={}, sa_column=Column(JSONB))
    incentive: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # Execution Settings
    total_call_target: Optional[int] = Field(default=None)
    call_duration: Optional[int] = Field(default=600)
    cohort_config: Optional[Dict[str, int]] = Field(default={}, sa_column=Column(JSONB))
    selected_cohorts: Optional[List[str]] = Field(default=[], sa_column=Column(JSONB))
    execution_windows: Optional[List[Dict[str, Any]]] = Field(default=[], sa_column=Column(JSONB))
    cohort_data: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSONB))
    
    # Associated Data
    goal_details: Optional[List[Dict[str, Any]]] = Field(default=[], sa_column=Column(JSONB))
    
    original_created_at: datetime = Field(description="Original creation time")
    original_updated_at: datetime = Field(description="Original last update time")
    archived_at: datetime = Field(default_factory=datetime.utcnow)
