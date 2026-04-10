"""
Voice Sandbox — Lead Queue Service

Lead model and priority queue logic. All lead data comes from
research_participants + research_leads + research_cohorts via the API layer.
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


# ── Fixed cohort lanes ─────────────────────────────────────────────

COHORT_META = {
    15: {"label": "15-Min Screening",  "accent": "emerald"},
    30: {"label": "30-Min Discovery",  "accent": "violet"},
    60: {"label": "60-Min Deep Dive",  "accent": "rose"},
}


# ── Lead Model ──────────────────────────────────────────────────────

class Lead:
    def __init__(
        self,
        id: str,
        name: str,
        company: str,
        score: int,
        cohort: InterviewDuration,
        contact_number: Optional[str] = None,
        cohort_name: Optional[str] = None,
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
        self.contact_number = contact_number
        self.cohort_name = cohort_name
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
            "contactNumber": self.contact_number,
            "cohortName": self.cohort_name,
            "status": self.status.value,
            "assignedAgentId": self.assigned_agent_id,
            "sentiment": self.sentiment.value if self.sentiment else None,
            "completedAt": self.completed_at,
            "executionCount": self.execution_count,
            "priorityScore": self.priority_score,
        }
