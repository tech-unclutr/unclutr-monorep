from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Relationship, Column
from sqlalchemy.dialects.postgresql import JSONB

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
    preliminary_questions: List[str] = Field(default=[], sa_column=Column(JSONB))
    incentive: Optional[str] = Field(default=None)
    
    # Metadata
    meta_data: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSONB))

    # Relationships
    # campaign: "Campaign" = Relationship(back_populates="cohorts")
