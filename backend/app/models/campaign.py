from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Column, Text, Relationship
from sqlalchemy.dialects.postgresql import JSONB

# Updated schema - removed deprecated Bolna columns

class Campaign(SQLModel, table=True):
    __tablename__ = "campaigns"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    company_id: UUID = Field(index=True)
    user_id: str = Field(index=True)
    
    name: str = Field(nullable=False)
    status: str = Field(default="DRAFT") # INITIATED, RINGING, IN_PROGRESS, COMPLETED, FAILED, DRAFT
    
    # Bolna Execution Data
    source_file_hash: Optional[str] = Field(default=None, index=True) # SHA256 hash of source CSV data
    # bolna_execution_id: Optional[str] = Field(default=None, index=True, unique=True)
    # bolna_agent_id: Optional[str] = Field(default=None)
    # bolna_call_status: Optional[str] = Field(default=None) # completed, failed, no-answer, busy, etc.
    # bolna_conversation_time: Optional[int] = Field(default=None) # Duration in seconds
    # bolna_total_cost: Optional[int] = Field(default=None) # Cost in cents
    # bolna_error_message: Optional[str] = Field(default=None)
    # bolna_transcript: Optional[str] = Field(default=None, sa_column=Column(Text))
    # bolna_extracted_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))
    # bolna_telephony_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))
    # bolna_raw_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB)) # Full raw webhook payload
    # bolna_created_at: Optional[datetime] = Field(default=None)
    # bolna_updated_at: Optional[datetime] = Field(default=None)
    
    # Team Member Info
    phone_number: Optional[str] = Field(default=None)
    team_member_role: Optional[str] = Field(default=None)
    team_member_department: Optional[str] = Field(default=None)
    
    # Legacy fields (for backward compatibility with simulation)
    decision_context: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSONB))
    
    # Quality Scoring
    quality_score: int = Field(default=0) # 0-5
    quality_gap: Optional[str] = Field(default=None) # Reason for low score
    
    # Context Fields (Voice Agent Feed)
    brand_context: Optional[str] = Field(default=None, sa_column=Column(Text))
    customer_context: Optional[str] = Field(default=None, sa_column=Column(Text))
    team_member_context: Optional[str] = Field(default=None, sa_column=Column(Text))
    preliminary_questions: Optional[List[str]] = Field(default=[], sa_column=Column(JSONB)) # Global Selection
    question_bank: Optional[List[str]] = Field(default=[], sa_column=Column(JSONB))
    incentive_bank: Optional[List[str]] = Field(default=[], sa_column=Column(JSONB))
    cohort_questions: Optional[Dict[str, List[str]]] = Field(default={}, sa_column=Column(JSONB)) # Mapping of cohort name to list of question strings
    cohort_incentives: Optional[Dict[str, str]] = Field(default={}, sa_column=Column(JSONB)) # Mapping of cohort name to incentive string
    incentive: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # Execution Settings
    total_call_target: Optional[int] = Field(default=None)
    call_duration: Optional[int] = Field(default=600) # Default 10 mins in seconds
    cohort_config: Optional[Dict[str, int]] = Field(default={}, sa_column=Column(JSONB)) # {cohort_name: target_count}
    selected_cohorts: Optional[List[str]] = Field(default=[], sa_column=Column(JSONB)) # List of selected cohort names
    execution_windows: Optional[List[Dict[str, Any]]] = Field(default=[], sa_column=Column(JSONB)) # [{start, end}]
    cohort_data: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSONB))
    
    # Execution Logic
    cohorts: List["Cohort"] = Relationship(sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    
    # Config for Bolna Execution
    execution_config: Optional[Dict[str, Any]] = Field(default={
        "max_concurrent_calls": 2, # Strict Limit for Free Tier
        "target_ready_buffer": 3, # Max 3 leads in human buffer
        "display_count": 2, # How many to show on frontend
        "overbook_cap": 10, # Max total READY items to prevent stale buffer
        "freshness_ttl_minutes": 60, # How long before a READY item is recycled
    }, sa_column=Column(JSONB))
    
    # Custom Analytics & dynamic extraction rules
    custom_analytics_config: Optional[List[Dict[str, Any]]] = Field(default=[], sa_column=Column(JSONB))
    
    # Metadata
    meta_data: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSONB))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
