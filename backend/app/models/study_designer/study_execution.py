from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class StudyExecution(SQLModel, table=True):
    """
    One execution session for a study. Created when the user enters
    the Execute phase in the Study Planner.
    """

    __tablename__ = "study_executions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    study_id: UUID = Field(index=True)
    company_id: UUID = Field()

    status: str = Field(default="DRAFT")
    # DRAFT → LOADING → READY → ACTIVE → PAUSED → COMPLETED

    bolna_agent_id: Optional[str] = Field(default=None)
    call_duration: int = Field(default=600)  # seconds

    cohort_interview_map: Optional[Dict[str, Any]] = Field(
        default={}, sa_column=Column(JSON)
    )
    execution_config: Optional[Dict[str, Any]] = Field(
        default={"max_concurrent_calls": 2}, sa_column=Column(JSON)
    )
    meta_data: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSON))

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
