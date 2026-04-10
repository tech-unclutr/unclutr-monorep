from uuid import UUID, uuid4

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class ResearchCohortQuestion(SQLModel, table=True):
    """
    Links a question to a cohort with an interview type bucket.
    Study context is implicit via question_id (research_questions.study_id).
    A question can appear in multiple cohorts/buckets.
    """

    __tablename__ = "research_cohort_questions"
    __table_args__ = (
        UniqueConstraint(
            "cohort_id", "question_id", "interview_type",
            name="uq_research_cohort_question_type",
        ),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    cohort_id: UUID = Field(foreign_key="research_cohorts.id", index=True)
    question_id: UUID = Field(foreign_key="research_questions.id", index=True)

    interview_type: str = Field(nullable=False)  # chat | audioA | audioB | audioC
    sort_order: int = Field(default=0)
