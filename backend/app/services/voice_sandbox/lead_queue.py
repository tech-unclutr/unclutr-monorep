"""
Voice Sandbox — Lead Queue Service

Priority queue logic for returning leads sorted by cohort and score.
Static seed data lives here; frontend fetches from this service.
"""

from typing import List, Optional
from enum import Enum


# ── Types ───────────────────────────────────────────────────────────

class LeadStatus(str, Enum):
    WAITING = "waiting"
    PROCESSING = "processing"
    COMPLETED = "completed"


class SentimentType(str, Enum):
    POSITIVE = "Positive"
    NEUTRAL = "Neutral"
    NEGATIVE = "Negative"


InterviewDuration = int  # 15 | 30 | 60


# ── Lead Model ──────────────────────────────────────────────────────

class Lead:
    def __init__(
        self,
        id: str,
        name: str,
        company: str,
        score: int,
        cohort: InterviewDuration,
        status: LeadStatus = LeadStatus.WAITING,
        assigned_agent_id: Optional[str] = None,
        sentiment: Optional[SentimentType] = None,
        completed_at: Optional[int] = None,
        execution_count: int = 0,
        priority_score: int = 0,
    ):
        self.id = id
        self.name = name
        self.company = company
        self.score = score
        self.cohort = cohort
        self.status = status
        self.assigned_agent_id = assigned_agent_id
        self.sentiment = sentiment
        self.completed_at = completed_at
        self.execution_count = execution_count
        self.priority_score = priority_score

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "company": self.company,
            "score": self.score,
            "cohort": self.cohort,
            "status": self.status.value,
            "assignedAgentId": self.assigned_agent_id,
            "sentiment": self.sentiment.value if self.sentiment else None,
            "completedAt": self.completed_at,
            "executionCount": self.execution_count,
            "priorityScore": self.priority_score,
        }


# ── Seed Data ───────────────────────────────────────────────────────

SEED_LEADS: List[Lead] = [
    # 15-Min Screening
    Lead(id="lead-1",  name="Laura Dern",    company="Wayne Ent.",       score=83, cohort=15),
    Lead(id="lead-2",  name="Hannah Abbott",  company="Acme Corp",       score=53, cohort=15),
    Lead(id="lead-3",  name="George Miller",  company="Globex",          score=41, cohort=15),
    Lead(id="lead-4",  name="Ian McKellen",   company="Massive Dynamic", score=62, cohort=15),
    Lead(id="lead-5",  name="Julia Roberts",  company="Wayne Ent.",      score=70, cohort=15),
    # 30-Min Discovery
    Lead(id="lead-6",  name="Diana Prince",   company="Stark Ind.",      score=88, cohort=30),
    Lead(id="lead-7",  name="Ian McKellen",   company="Soylent Corp",    score=79, cohort=30),
    Lead(id="lead-8",  name="Ian McKellen",   company="Cyberdyne",       score=48, cohort=30),
    Lead(id="lead-9",  name="Hannah Abbott",  company="Initech",         score=48, cohort=30),
    Lead(id="lead-10", name="Ian McKellen",   company="Acme Corp",       score=79, cohort=30),
    # 60-Min Deep Dive
    Lead(id="lead-11", name="Evan Wright",    company="Hooli",           score=42, cohort=60),
    Lead(id="lead-12", name="Evan Wright",    company="Globex",          score=55, cohort=60),
    Lead(id="lead-13", name="Laura Dern",     company="Initech",         score=67, cohort=60),
    Lead(id="lead-14", name="George Miller",  company="Wayne Ent.",      score=39, cohort=60),
    Lead(id="lead-15", name="Julia Roberts",  company="Cyberdyne",       score=91, cohort=60),
]

COHORT_META = {
    15: {"label": "15-Min Screening",  "accent": "emerald"},
    30: {"label": "30-Min Discovery",  "accent": "violet"},
    60: {"label": "60-Min Deep Dive",  "accent": "rose"},
}

COHORT_PIPELINE_COUNTS = {
    15: 520,
    30: 490,
    60: 480,
}


# ── Priority Queue Logic ────────────────────────────────────────────

def get_sorted_leads(
    leads: List[Lead],
    cohort: Optional[InterviewDuration] = None,
    status: Optional[LeadStatus] = None,
) -> List[dict]:
    """
    Returns leads sorted by priority for the frontend.

    Sort order (matches queue_warmer behavior):
      1. priority_score DESC  — retry/scheduled leads (boosted to 999) go first
      2. score DESC           — highest quality leads next
      3. id ASC               — stable tiebreaker

    Optionally filtered by cohort and/or status.
    """
    filtered = leads

    if cohort is not None:
        filtered = [l for l in filtered if l.cohort == cohort]

    if status is not None:
        filtered = [l for l in filtered if l.status == status]

    sorted_leads = sorted(
        filtered,
        key=lambda l: (l.priority_score, l.score, l.id),
        reverse=True,
    )

    return [l.to_dict() for l in sorted_leads]


def get_pipeline_state(leads: List[Lead]) -> dict:
    """
    Returns the full pipeline state grouped by cohort, sorted by priority.
    This is what the frontend fetches to render all three queue lanes.
    """
    result = {}

    for cohort_duration, meta in COHORT_META.items():
        waiting = get_sorted_leads(leads, cohort=cohort_duration, status=LeadStatus.WAITING)
        processing = get_sorted_leads(leads, cohort=cohort_duration, status=LeadStatus.PROCESSING)
        completed = get_sorted_leads(leads, cohort=cohort_duration, status=LeadStatus.COMPLETED)

        result[cohort_duration] = {
            **meta,
            "totalCount": COHORT_PIPELINE_COUNTS[cohort_duration],
            "waiting": waiting,
            "processing": processing,
            "completed": completed,
            "waitingCount": len(waiting),
            "processingCount": len(processing),
            "completedCount": len(completed),
        }

    return result
