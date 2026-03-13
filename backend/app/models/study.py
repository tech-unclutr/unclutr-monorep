"""
SQLModel definitions for the Study Explorer database tables.
Maps to the schema defined in database/create_schema.sql
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, SmallInteger, Text, Enum as SAEnum
from sqlmodel import Field, Relationship, SQLModel

import enum


# ── Enums ───────────────────────────────────────

class OwnershipType(str, enum.Enum):
    owned = "owned"
    co_owned = "co_owned"
    consumed = "consumed"


class RecommendationTier(str, enum.Enum):
    must_have = "must_have"
    good_to_have = "good_to_have"
    advanced = "advanced"
    overkill_early = "overkill_early"


class CostTier(str, enum.Enum):
    DIY = "DIY"
    lean = "lean"
    assisted = "assisted"
    agency = "agency"


class CadenceType(str, enum.Enum):
    always_on = "always_on"
    quarterly = "quarterly"
    biannual_annual = "biannual_annual"


# ── Lookup Tables ───────────────────────────────

class StudyCategory(SQLModel, table=True):
    __tablename__ = "study_categories"

    category_id: Optional[int] = Field(default=None, primary_key=True)
    category_name: str = Field(max_length=120, unique=True)
    category_slug: str = Field(max_length=120, unique=True)

    # Relationships
    studies: List["StudyModel"] = Relationship(back_populates="category")


class IndustryModel(SQLModel, table=True):
    __tablename__ = "industries"

    industry_id: Optional[int] = Field(default=None, primary_key=True)
    industry_name: str = Field(max_length=80, unique=True)
    industry_slug: str = Field(max_length=80, unique=True)
    illustration_key: Optional[str] = Field(default=None, max_length=80)
    is_popular: bool = Field(default=False)
    display_order: int = Field(default=0, sa_column=Column(SmallInteger))

    # Relationships
    study_links: List["StudyIndustry"] = Relationship(back_populates="industry")
    recommendations: List["IndustryRecommendation"] = Relationship(back_populates="industry")


class Department(SQLModel, table=True):
    __tablename__ = "departments"

    dept_id: Optional[int] = Field(default=None, primary_key=True)
    dept_name: str = Field(max_length=80, unique=True)
    display_order: int = Field(default=0, sa_column=Column(SmallInteger))

    # Relationships
    study_links: List["StudyDepartment"] = Relationship(back_populates="department")


class LifecycleStage(SQLModel, table=True):
    __tablename__ = "lifecycle_stages"

    stage_id: Optional[int] = Field(default=None, primary_key=True)
    stage_name: str = Field(max_length=80, unique=True)
    display_order: int = Field(default=0, sa_column=Column(SmallInteger))

    # Relationships
    study_links: List["StudyLifecycleStage"] = Relationship(back_populates="stage")


class StartupStage(SQLModel, table=True):
    __tablename__ = "startup_stages"

    stage_id: Optional[int] = Field(default=None, primary_key=True)
    stage_name: str = Field(max_length=40, unique=True)
    display_order: int = Field(default=0, sa_column=Column(SmallInteger))

    # Relationships
    study_links: List["StudyStartupStage"] = Relationship(back_populates="stage")


# ── Bridge / Junction Tables ────────────────────

class StudyDepartment(SQLModel, table=True):
    __tablename__ = "study_departments"

    id: Optional[int] = Field(default=None, primary_key=True)
    study_id: int = Field(foreign_key="studies.study_id", index=True)
    dept_id: int = Field(foreign_key="departments.dept_id", index=True)
    ownership_type: str = Field(default="owned")

    # Relationships
    study: Optional["StudyModel"] = Relationship(back_populates="department_links")
    department: Optional["Department"] = Relationship(back_populates="study_links")


class StudyLifecycleStage(SQLModel, table=True):
    __tablename__ = "study_lifecycle_stages"

    id: Optional[int] = Field(default=None, primary_key=True)
    study_id: int = Field(foreign_key="studies.study_id", index=True)
    stage_id: int = Field(foreign_key="lifecycle_stages.stage_id", index=True)

    # Relationships
    study: Optional["StudyModel"] = Relationship(back_populates="lifecycle_stage_links")
    stage: Optional["LifecycleStage"] = Relationship(back_populates="study_links")


class StudyStartupStage(SQLModel, table=True):
    __tablename__ = "study_startup_stages"

    id: Optional[int] = Field(default=None, primary_key=True)
    study_id: int = Field(foreign_key="studies.study_id", index=True)
    stage_id: int = Field(foreign_key="startup_stages.stage_id", index=True)

    # Relationships
    study: Optional["StudyModel"] = Relationship(back_populates="startup_stage_links")
    stage: Optional["StartupStage"] = Relationship(back_populates="study_links")


class StudyIndustry(SQLModel, table=True):
    __tablename__ = "study_industries"

    id: Optional[int] = Field(default=None, primary_key=True)
    study_id: int = Field(foreign_key="studies.study_id", index=True)
    industry_id: int = Field(foreign_key="industries.industry_id", index=True)
    must_do: bool = Field(default=False)
    can_skip: bool = Field(default=False)

    # Relationships
    study: Optional["StudyModel"] = Relationship(back_populates="industry_links")
    industry: Optional["IndustryModel"] = Relationship(back_populates="study_links")


class IndustryRecommendation(SQLModel, table=True):
    __tablename__ = "industry_recommendations"

    id: Optional[int] = Field(default=None, primary_key=True)
    industry_id: int = Field(foreign_key="industries.industry_id", index=True)
    study_id: int = Field(foreign_key="studies.study_id", index=True)
    recommendation_tier: str
    unique_notes: Optional[str] = Field(default=None, sa_column=Column(Text))

    # Relationships
    industry: Optional["IndustryModel"] = Relationship(back_populates="recommendations")
    study: Optional["StudyModel"] = Relationship(back_populates="recommendation_links")


class StudyCost(SQLModel, table=True):
    __tablename__ = "study_costs"

    id: Optional[int] = Field(default=None, primary_key=True)
    study_id: int = Field(foreign_key="studies.study_id", index=True)
    cost_tier: str
    cost_min_inr: int = Field(default=0)
    cost_max_inr: Optional[int] = Field(default=None)

    # Relationships
    study: Optional["StudyModel"] = Relationship(back_populates="costs")


class StudyCadence(SQLModel, table=True):
    __tablename__ = "study_cadence"

    id: Optional[int] = Field(default=None, primary_key=True)
    study_id: int = Field(foreign_key="studies.study_id", index=True)
    cadence_type: str

    # Relationships
    study: Optional["StudyModel"] = Relationship(back_populates="cadence_links")


# ── Core Study Table ────────────────────────────

class StudyModel(SQLModel, table=True):
    __tablename__ = "studies"

    study_id: Optional[int] = Field(default=None, primary_key=True)
    category_id: Optional[int] = Field(default=None, foreign_key="study_categories.category_id")
    study_family: Optional[str] = Field(default=None, max_length=200)
    study_name: str = Field(max_length=200, unique=True)
    alternate_names: Optional[str] = Field(default=None, sa_column=Column(Text))
    tagline: Optional[str] = Field(default=None, max_length=200)
    signal_type: Optional[str] = Field(default=None, max_length=20)
    primary_goal: Optional[str] = Field(default=None, sa_column=Column(Text))
    questions_answered: Optional[str] = Field(default=None, sa_column=Column(Text))
    decisions_unlocked: Optional[str] = Field(default=None, sa_column=Column(Text))
    best_timing_trigger: Optional[str] = Field(default=None, sa_column=Column(Text))
    frequency_cadence: Optional[str] = Field(default=None, max_length=120)
    urgency: Optional[str] = Field(default=None, max_length=4)
    practice_level: Optional[str] = Field(default=None, max_length=20)
    priority_label: Optional[str] = Field(default=None, max_length=40)
    dri_role: Optional[str] = Field(default=None, max_length=120)
    method_type: Optional[str] = Field(default=None, max_length=30)
    typical_sample_type: Optional[str] = Field(default=None, sa_column=Column(Text))
    typical_sample_size: Optional[str] = Field(default=None, max_length=40)
    best_execution_method: Optional[str] = Field(default=None, sa_column=Column(Text))
    scrappy_version: Optional[str] = Field(default=None, sa_column=Column(Text))
    gold_standard_version: Optional[str] = Field(default=None, sa_column=Column(Text))
    india_execution_notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    language_regional_notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    online_vs_offline: Optional[str] = Field(default=None, max_length=20)
    key_success_criteria: Optional[str] = Field(default=None, sa_column=Column(Text))
    guardrails_validity_checks: Optional[str] = Field(default=None, sa_column=Column(Text))
    output_artifact: Optional[str] = Field(default=None, sa_column=Column(Text))
    main_kpis_metrics: Optional[str] = Field(default=None, sa_column=Column(Text))
    common_mistakes: Optional[str] = Field(default=None, sa_column=Column(Text))
    time_to_insight: Optional[str] = Field(default=None, max_length=40)
    main_cost_drivers: Optional[str] = Field(default=None, sa_column=Column(Text))
    roi_conditions: Optional[str] = Field(default=None, sa_column=Column(Text))
    priority_score: Optional[int] = Field(default=None, sa_column=Column(SmallInteger))
    roi_score: Optional[str] = Field(default=None, max_length=10)
    notes_nuances: Optional[str] = Field(default=None, sa_column=Column(Text))
    requires_direct_touchpoint: bool = Field(default=False)
    is_featured: bool = Field(default=False)
    is_prioritization_pack: bool = Field(default=False)
    priority_rank: Optional[int] = Field(default=None, sa_column=Column(SmallInteger))
    why_it_matters_short: Optional[str] = Field(default=None, sa_column=Column(Text))
    canonical_industry_buckets: Optional[str] = Field(default=None, max_length=200)
    is_locked: bool = Field(default=True)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    # Relationships
    category: Optional["StudyCategory"] = Relationship(back_populates="studies")
    department_links: List["StudyDepartment"] = Relationship(back_populates="study")
    industry_links: List["StudyIndustry"] = Relationship(back_populates="study")
    lifecycle_stage_links: List["StudyLifecycleStage"] = Relationship(back_populates="study")
    startup_stage_links: List["StudyStartupStage"] = Relationship(back_populates="study")
    recommendation_links: List["IndustryRecommendation"] = Relationship(back_populates="study")
    costs: List["StudyCost"] = Relationship(back_populates="study")
    cadence_links: List["StudyCadence"] = Relationship(back_populates="study")
