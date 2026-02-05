from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class Cohort(SQLModel, table=True):
    __tablename__ = "cohorts"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    campaign_id: UUID = Field(foreign_key="campaigns.id", index=True)
    
    name: str = Field(nullable=False)
    description: Optional[str] = Field(default=None)
    
    # Execution Logic
    weight: int = Field(default=1) # Relative weight for queue mixing (e.g. 50/50 split)
    min_ready_floor: int = Field(default=1) # Minimum number of READY items to maintain
    
    # Specific Configs
    preliminary_questions: List[str] = Field(default=[], sa_column=Column(JSON))
    incentive: Optional[str] = Field(default=None)
    
    # Metadata
    meta_data: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSON))

    # Relationships
    # campaign: "Campaign" = Relationship(back_populates="cohorts")
