from typing import Optional
from sqlmodel import Field, SQLModel, Column, JSON
from datetime import datetime
import uuid

class OnboardingStep(int):
    IDENTITY = 1
    STACK = 2
    TRUTH_CONFIG = 3
    REVIEW = 4

class OnboardingState(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(index=True, unique=True)
    
    current_step: int = Field(default=OnboardingStep.IDENTITY)
    is_completed: bool = Field(default=False)
    
    # Store page-wise data as JSON
    identity_data: dict = Field(default_factory=dict, sa_column=Column(JSON))
    stack_data: dict = Field(default_factory=dict, sa_column=Column(JSON))
    truth_data: dict = Field(default_factory=dict, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
