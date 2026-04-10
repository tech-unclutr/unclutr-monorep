from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class ResearchQuestion(SQLModel, table=True):
    """
    Individual question created by the study designer.
    Extracted from DesignedStudy.topic_guide into proper rows.
    """

    __tablename__ = "research_questions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    study_id: UUID = Field(foreign_key="designed_studies.id", index=True)
    company_id: UUID = Field(index=True)

    text: str = Field(nullable=False)
    type: str = Field(default="open_ended")  # open_ended, single_select, multiselect
    context: Optional[str] = Field(default=None)  # interviewer guidance: probes, what to listen for
    interview_mode: Optional[str] = Field(default=None)  # video_call, audio_call, chat
    participant_count: Optional[int] = Field(default=None)  # recommended sample size
    sort_order: int = Field(default=0)

    options: Optional[List[Any]] = Field(default=[], sa_column=Column(JSON))  # for select-type questions
    probes: Optional[List[Any]] = Field(default=[], sa_column=Column(JSON))  # follow-up probes
    stimulus: Optional[List[Any]] = Field(default=[], sa_column=Column(JSON))  # visual/audio stimuli

    meta_data: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
