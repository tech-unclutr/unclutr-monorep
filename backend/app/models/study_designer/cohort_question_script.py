from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class CohortQuestionScript(SQLModel, table=True):
    """
    One row per question in a per-cohort LLM-generated interview script.

    Scripts are grouped by the study's Key Research Questions (KRQs). Each
    question carries the rich metadata emitted by the script-generation prompt
    (Uncovers, Objective Link, Tag, Depth, Type, Probes, Time, priority).

    Replaces the old `research_questions` table entirely.
    """

    __tablename__ = "research_question_scripts"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    cohort_id: UUID = Field(foreign_key="research_cohorts.id", index=True)
    study_id: UUID = Field(foreign_key="designed_studies.id", index=True)
    company_id: UUID = Field(index=True)

    # KRQ grouping
    krq_index: int = Field(nullable=False)  # 1-based index into study.key_research_questions
    krq_section_text: str = Field(nullable=False)  # frozen copy of the KRQ text at generation time
    krq_sort_order: int = Field(default=0)

    # Question
    question_number: int = Field(nullable=False)  # "QX" from the prompt
    sort_order: int = Field(default=0)  # ordering within the KRQ group
    text: str = Field(nullable=False)
    uncovers: str = Field(default="")
    objective_link: str = Field(default="")
    tag: str = Field(default="")
    depth: int = Field(default=1)  # 1 = surface, 2 = deep
    type_descriptor: str = Field(default="")
    probes: List[Any] = Field(default=[], sa_column=Column(JSON))
    estimated_minutes: float = Field(default=0.0)
    priority: str = Field(default="must_ask")  # "must_ask" | "if_time_permits"

    created_at: datetime = Field(default_factory=datetime.utcnow)
