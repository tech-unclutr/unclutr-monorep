from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON, UniqueConstraint
from sqlmodel import Column, Field, SQLModel, Text


class DesignedStudy(SQLModel, table=True):
    __tablename__ = "designed_studies"
    __table_args__ = (
        UniqueConstraint("company_id", "title", name="uq_company_study_title"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    company_id: UUID = Field(index=True)
    user_id: str = Field(index=True)
    title: str = Field(nullable=False)
    status: str = Field(default="DRAFT", index=True)

    initial_prompt: Optional[str] = Field(default="", sa_column=Column(Text))
    briefing: Optional[str] = Field(default="", sa_column=Column(Text))
    executive_summary: Optional[str] = Field(default="", sa_column=Column(Text))
    emotion_detection: bool = Field(default=False)
    participant_languages: List[str] = Field(default=["English"], sa_column=Column(JSON))
    reporting_language: str = Field(default="English")

    advanced_settings: Dict[str, Any] = Field(
        default={
            "maxDuration": 30,
            "recordVideo": True,
            "recordAudio": True,
            "allowSkipQuestions": False,
        },
        sa_column=Column(JSON),
    )
    welcome_page: Dict[str, Any] = Field(
        default={"title": "", "description": ""},
        sa_column=Column(JSON),
    )
    topic_guide: Dict[str, Any] = Field(
        default={"introQuestions": [], "objectives": []},
        sa_column=Column(JSON),
    )
    key_research_questions: List[Dict[str, Any]] = Field(
        default=[], sa_column=Column(JSON)
    )
    conversation_history: Optional[List[Dict[str, Any]]] = Field(
        default=[], sa_column=Column(JSON)
    )

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
