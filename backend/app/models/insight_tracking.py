"""
Insight tracking models for Phase 3.

Purpose:
- Track insight generation history
- Track user interactions (impressions, clicks, dismissals)
- Track suppression rules (prevent fatigue)
"""

from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Column, Relationship
from sqlalchemy.dialects import postgresql


class InsightGenerationLog(SQLModel, table=True):
    """
    Tracks each insight deck generation.
    
    Used for:
    - Debugging validation failures
    - Performance monitoring
    - Historical analysis
    """
    __tablename__ = "insight_generation_log"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    brand_id: UUID = Field(foreign_key="brand.id", nullable=False, index=True)
    generated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False, index=True)
    insights: Dict[str, Any] = Field(default={}, sa_column=Column(postgresql.JSONB))
    briefing: Optional[str] = Field(default=None)
    generation_time_ms: Optional[int] = Field(default=None)
    validation_failures: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(postgresql.JSONB))


class InsightImpression(SQLModel, table=True):
    """
    Tracks when insights are shown to users and their interactions.
    
    Used for:
    - A/B testing
    - Learning which insights drive action
    - Calculating engagement rates
    """
    __tablename__ = "insight_impression"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    brand_id: UUID = Field(foreign_key="brand.id", nullable=False, index=True)
    insight_id: str = Field(nullable=False, index=True)  # e.g., "frozen_cash"
    shown_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    clicked: bool = Field(default=False)
    dismissed: bool = Field(default=False)
    action_taken: Optional[str] = Field(default=None)  # e.g., "ran_clearance_sale"


class InsightSuppression(SQLModel, table=True):
    """
    Tracks insights that should be suppressed (not shown).
    
    Used for:
    - Preventing insight fatigue (dismissed 3+ times)
    - Respecting user preferences
    - Temporarily hiding low-engagement insights
    """
    __tablename__ = "insight_suppression"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    brand_id: UUID = Field(foreign_key="brand.id", nullable=False, index=True)
    insight_id: str = Field(nullable=False)
    suppressed_until: datetime = Field(nullable=False, index=True)
    reason: Optional[str] = Field(default=None)  # e.g., "dismissed_3_times"
    
    class Config:
        # Unique constraint on (brand_id, insight_id)
        table_args = (
            {"schema": None},
        )
