"""
Voice Sandbox — Promotion Engine

Drives the lead-to-agent assignment loop on the backend.
Holds in-memory state, exposes tick-based promotion and completion.
Frontend polls /state — all decisions happen here.

Mirrors queue_warmer logic:
  - Score-sorted pickup (priority_score DESC, score DESC)
  - Cohort-scoped: agents only pull from their duration lane
  - Max concurrency per cohort (default 2)
  - Max 2 execution attempts per lead
  - Retry with priority boost (999)
  - Simulated call duration (no Bolna)
"""

import copy
import random
import time
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass, field

from app.services.voice_sandbox.lead_queue import (
    SEED_LEADS,
    COHORT_META,
    COHORT_PIPELINE_COUNTS,
    Lead,
    LeadStatus,
    SentimentType,
)

logger = logging.getLogger(__name__)


# ── Agent model (kept here, not in lead_queue — agents are execution-only) ──

@dataclass
class Agent:
    id: str
    name: str
    role: str
    duration: int  # 15 | 30 | 60
    status: str = "idle"  # idle | processing
    current_lead_id: Optional[str] = None
    call_started_at: Optional[float] = None  # time.time() when call began

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "duration": self.duration,
            "status": self.status,
            "currentLeadId": self.current_lead_id,
        }


@dataclass
class ActivityEntry:
    id: str
    lead_id: str
    lead_name: str
    lead_company: str
    cohort: int
    sentiment: str
    outcome: str  # "completed" | "retry" | "no_answer" | "voicemail" etc.
    completed_at: float

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "leadId": self.lead_id,
            "leadName": self.lead_name,
            "leadCompany": self.lead_company,
            "cohort": self.cohort,
            "sentiment": self.sentiment,
            "outcome": self.outcome,
            "completedAt": self.completed_at,
        }


# ── Config ──────────────────────────────────────────────────────────

SEED_AGENTS = [
    Agent(id="agent-ava",    name="Ava",    role="15-Min Interview", duration=15),
    Agent(id="agent-leo",    name="Leo",    role="15-Min Interview", duration=15),
    Agent(id="agent-marcus", name="Marcus", role="30-Min Interview", duration=30),
    Agent(id="agent-nina",   name="Nina",   role="30-Min Interview", duration=30),
    Agent(id="agent-sarah",  name="Sarah",  role="60-Min Interview", duration=60),
    Agent(id="agent-raj",    name="Raj",    role="60-Min Interview", duration=60),
]

MAX_CONCURRENCY_PER_COHORT = 2
MAX_EXECUTION_COUNT = 2
RETRY_PRIORITY_BOOST = 999

# Simulated call duration range (seconds)
CALL_DURATION_MIN = 6
CALL_DURATION_MAX = 10

# Probability that a completed call needs retry (simulates voicemail/no-answer/hangup)
RETRY_PROBABILITY = 0.3

SENTIMENTS = [SentimentType.POSITIVE, SentimentType.NEUTRAL, SentimentType.NEGATIVE]

RETRY_OUTCOMES = ["voicemail", "no_answer", "hangup", "busy"]
SUCCESS_OUTCOMES = ["completed", "interested", "not_interested"]


# ── Engine ──────────────────────────────────────────────────────────

class PromotionEngine:
    """
    In-memory state machine for the voice sandbox.

    Call tick() periodically (via polling endpoint or background task).
    Each tick:
      1. Check if any processing agents have finished their simulated call
      2. Promote waiting leads to idle agents (score-sorted, cohort-matched)
    """

    def __init__(self):
        self._reset()

    def _reset(self):
        self.leads: List[Lead] = [self._clone_lead(l) for l in SEED_LEADS]
        self.agents: List[Agent] = [self._clone_agent(a) for a in SEED_AGENTS]
        self.activity: List[ActivityEntry] = []
        self.pipeline_counts: Dict[int, int] = dict(COHORT_PIPELINE_COUNTS)
        self.running: bool = False
        self._activity_counter: int = 0

    def _clone_lead(self, lead: Lead) -> Lead:
        return Lead(
            id=lead.id,
            name=lead.name,
            company=lead.company,
            score=lead.score,
            cohort=lead.cohort,
            status=LeadStatus.WAITING,
            execution_count=0,
            priority_score=0,
        )

    def _clone_agent(self, agent: Agent) -> Agent:
        return Agent(
            id=agent.id,
            name=agent.name,
            role=agent.role,
            duration=agent.duration,
        )

    # ── Public API ──────────────────────────────────────────────────

    def start(self):
        """Begin the promotion loop."""
        self.running = True
        logger.info("[PromotionEngine] Started")

    def stop(self):
        """Pause the promotion loop."""
        self.running = False
        logger.info("[PromotionEngine] Stopped")

    def reset(self):
        """Reset all state to initial seed data."""
        self._reset()
        logger.info("[PromotionEngine] Reset to initial state")

    def tick(self) -> dict:
        """
        One cycle of the engine. Call this from a polling endpoint.

        Returns the full state after the tick.
        """
        if not self.running:
            return self.get_state()

        # Step 1: Complete any agents whose simulated call is done
        self._check_completions()

        # Step 2: Promote waiting leads to idle agents
        self._promote()

        return self.get_state()

    def get_state(self) -> dict:
        """Returns the full state for the frontend to render."""
        leads_by_cohort = {}

        for cohort_duration, meta in COHORT_META.items():
            cohort_leads = [l for l in self.leads if l.cohort == cohort_duration]

            waiting = sorted(
                [l for l in cohort_leads if l.status == LeadStatus.WAITING],
                key=lambda l: (l.priority_score, l.score),
                reverse=True,
            )
            processing = [l for l in cohort_leads if l.status == LeadStatus.PROCESSING]
            completed = [l for l in cohort_leads if l.status == LeadStatus.COMPLETED]

            leads_by_cohort[cohort_duration] = {
                **meta,
                "totalCount": self.pipeline_counts[cohort_duration],
                "waiting": [l.to_dict() for l in waiting],
                "processing": [l.to_dict() for l in processing],
                "completed": [l.to_dict() for l in completed],
                "waitingCount": len(waiting),
                "processingCount": len(processing),
                "completedCount": len(completed),
            }

        return {
            "running": self.running,
            "leads": leads_by_cohort,
            "agents": [a.to_dict() for a in self.agents],
            "activity": [a.to_dict() for a in self.activity[:50]],  # cap at 50 recent
        }

    # ── Internal logic ──────────────────────────────────────────────

    def _promote(self):
        """
        Find ONE idle agent and assign the highest-priority waiting lead
        from its cohort. Only one promotion per tick — creates natural
        staggered pickup as the frontend polls every 1.5s.

        Mirrors queue_warmer._promote_buffer():
          - Cohort-scoped
          - priority_score DESC, score DESC
          - Respects max concurrency per cohort
          - Skips leads with execution_count >= MAX_EXECUTION_COUNT
        """
        for agent in self.agents:
            if agent.status != "idle":
                continue

            # Check concurrency cap for this cohort
            active_in_cohort = sum(
                1 for a in self.agents
                if a.duration == agent.duration and a.status == "processing"
            )
            if active_in_cohort >= MAX_CONCURRENCY_PER_COHORT:
                continue

            # Find best waiting lead in this cohort
            candidates = [
                l for l in self.leads
                if l.status == LeadStatus.WAITING
                and l.cohort == agent.duration
                and l.execution_count < MAX_EXECUTION_COUNT
            ]

            if not candidates:
                continue

            # Sort: priority_score DESC, score DESC (matches queue_warmer ORDER BY)
            candidates.sort(key=lambda l: (l.priority_score, l.score), reverse=True)
            lead = candidates[0]

            # Assign
            lead.status = LeadStatus.PROCESSING
            lead.assigned_agent_id = agent.id
            lead.execution_count += 1

            agent.status = "processing"
            agent.current_lead_id = lead.id
            agent.call_started_at = time.time()

            logger.info(
                f"[PromotionEngine] Promoted {lead.name} (score={lead.score}, "
                f"priority={lead.priority_score}, attempt={lead.execution_count}) "
                f"→ {agent.name} [{agent.duration}-min]"
            )

            # Only one promotion per tick — staggered pickup
            return

    def _check_completions(self):
        """
        Check if any processing agents have exceeded their simulated call duration.
        If so, determine outcome (success or retry).
        """
        now = time.time()

        for agent in self.agents:
            if agent.status != "processing" or not agent.call_started_at:
                continue

            # Simulated call duration (randomized per call on first check)
            elapsed = now - agent.call_started_at
            call_duration = CALL_DURATION_MIN + (
                hash(agent.current_lead_id or "") % (CALL_DURATION_MAX - CALL_DURATION_MIN + 1)
            )

            if elapsed < call_duration:
                continue

            # Call is done — find the lead
            lead = next((l for l in self.leads if l.id == agent.current_lead_id), None)
            if not lead:
                # Safety: free the agent anyway
                agent.status = "idle"
                agent.current_lead_id = None
                agent.call_started_at = None
                continue

            # Determine outcome
            should_retry = (
                random.random() < RETRY_PROBABILITY
                and lead.execution_count < MAX_EXECUTION_COUNT
            )

            if should_retry:
                # Retry: lead goes back to waiting with boosted priority
                outcome = random.choice(RETRY_OUTCOMES)
                lead.status = LeadStatus.WAITING
                lead.assigned_agent_id = None
                lead.priority_score = RETRY_PRIORITY_BOOST

                logger.info(
                    f"[PromotionEngine] Retry: {lead.name} → {outcome} "
                    f"(attempt {lead.execution_count}/{MAX_EXECUTION_COUNT}, priority boosted to {RETRY_PRIORITY_BOOST})"
                )
            else:
                # Completed: lead is done
                outcome = random.choice(SUCCESS_OUTCOMES)
                lead.status = LeadStatus.COMPLETED
                lead.assigned_agent_id = None
                lead.sentiment = random.choice(SENTIMENTS)
                lead.completed_at = int(now * 1000)

                self.pipeline_counts[lead.cohort] = max(
                    0, self.pipeline_counts[lead.cohort] - 1
                )

                logger.info(
                    f"[PromotionEngine] Completed: {lead.name} → {outcome} "
                    f"(sentiment={lead.sentiment.value})"
                )

            # Log activity
            self._activity_counter += 1
            self.activity.insert(0, ActivityEntry(
                id=f"act-{self._activity_counter}",
                lead_id=lead.id,
                lead_name=lead.name,
                lead_company=lead.company,
                cohort=lead.cohort,
                sentiment=lead.sentiment.value if lead.sentiment else "Neutral",
                outcome=outcome,
                completed_at=now * 1000,
            ))

            # Free the agent
            agent.status = "idle"
            agent.current_lead_id = None
            agent.call_started_at = None


# ── Singleton ───────────────────────────────────────────────────────

engine = PromotionEngine()
