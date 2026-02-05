from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class InsightFeedback(SQLModel, table=True):
    __tablename__ = "insight_feedback"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    insight_id: str = Field(index=True)
    brand_id: UUID = Field(index=True)
    status: str = Field(description="ACCEPTED, REJECTED, ALREADY_DONE, SNOOZED")
    
    # Verification Logic
    verification_intent: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    verification_status: str = Field(default="PENDING", description="PENDING, VERIFIED, FAILED")
    
    user_comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    verified_at: Optional[datetime] = None

class FeedbackLearning(SQLModel, table=True):
    __tablename__ = "feedback_learning"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    brand_id: UUID = Field(index=True)
    generator_type: str
    refusal_reason: str = Field(description="SEASONAL, STRATEGIC_HOLD, FALSE_POSITIVE")
    learning_vector: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
