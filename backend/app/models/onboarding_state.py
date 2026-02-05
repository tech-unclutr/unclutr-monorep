import uuid
from datetime import datetime

from sqlmodel import JSON, Column, Field, SQLModel

from app.models.base_mixins import UserTrackedModel


class OnboardingStep(int):
    """DEPRECATED: Use page names instead"""
    IDENTITY = 1
    STACK = 2
    TRUTH_CONFIG = 3
    REVIEW = 4

class OnboardingState(UserTrackedModel, SQLModel, table=True):
    __tablename__ = "onboarding_state"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(index=True, unique=True)
    
    # Progress Tracking
    current_page: str = Field(default='basics')  # 'basics' | 'channels' | 'stack' | 'finish'
    current_step: int = Field(default=1)  # DEPRECATED: Keep for backward compatibility
    is_completed: bool = Field(default=False)
    
    # Page-wise Data Storage (JSON)
    basics_data: dict = Field(default_factory=dict, sa_column=Column(JSON))
    channels_data: dict = Field(default_factory=dict, sa_column=Column(JSON))
    stack_data: dict = Field(default_factory=dict, sa_column=Column(JSON))
    finish_data: dict = Field(default_factory=dict, sa_column=Column(JSON))
    

    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_saved_at: datetime = Field(default_factory=datetime.utcnow)

