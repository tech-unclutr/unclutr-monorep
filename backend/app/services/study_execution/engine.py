"""
Study Execution — Orchestration Engine

Tick-based state machine that drives the study execution flow.
Creates queue items, promotes leads, initiates Bolna calls, and
returns pipeline state for the VoiceSandbox frontend.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID

from loguru import logger
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.designed_study import DesignedStudy
from app.models.study_designer.research_cohort import ResearchCohort
from app.models.study_designer.research_lead import ResearchLead
from app.models.study_designer.research_participant import ResearchParticipant
from app.models.study_designer.study_call_log import StudyCallLog
from app.models.study_designer.study_call_queue import StudyCallQueue
from app.models.study_designer.study_execution import StudyExecution
from app.services.study_execution.caller import initiate_call
from app.services.study_execution.outcomes import (
    MAX_EXECUTION_COUNT,
    RETRY_COOLDOWN_MINUTES,
    determine_call_outcome,
    human_outcome,
    is_terminal_state,
    should_retry,
)
# prompt_builder is intentionally not imported here. The legacy prompt-builder
# sources (ResearchQuestion / ResearchCohortQuestion) have been severed; the
# per-cohort script feature will rewire this. Queue advancement works without
# prompt content — runtime uses placeholders.


# ── Constants ──────────────────────────────────────────────────────

COHORT_META = {
    15: {"label": "15-Min Screening", "accent": "emerald"},
    30: {"label": "30-Min Discovery", "accent": "violet"},
    60: {"label": "60-Min Deep Dive", "accent": "rose"},
}

AGENT_NAMES = ["Ava", "Leo", "Marcus", "Nina", "Sarah", "Raj"]

# Queue item statuses that mean "waiting" from the frontend's perspective
WAITING_STATUSES = ("PENDING", "READY", "SCHEDULED")
DIALING_STATUS = "DIALING"

# Terminal statuses — call is done
TERMINAL_STATUSES = (
    "COMPLETED", "INTENT_YES", "INTENT_NO", "DNC", "WRONG_PERSON",
    "VOICEMAIL", "NO_ANSWER", "BUSY", "HANGUP", "SILENCE",
    "LANGUAGE_BARRIER", "FAILED_CONNECT", "FAX_ROBOT", "AMBIGUOUS",
    "DISCONNECTED",
)


# ── Engine ─────────────────────────────────────────────────────────

class StudyExecutionEngine:

    @staticmethod
    async def create_execution(
        session: AsyncSession,
        study_id: UUID,
        company_id: UUID,
        cohort_interview_map: Dict[str, List[int]],
    ) -> StudyExecution:
        """
        Create a StudyExecution and populate StudyCallQueue from
        research_participants × cohort_interview_map.

        Prompts are built server-side via build_per_combination_prompts().
        """
        # Verify study exists
        study = await session.get(DesignedStudy, study_id)
        if not study:
            raise ValueError(f"Study {study_id} not found")

        # Prompt building is stubbed: the legacy source tables
        # (research_questions / research_cohort_questions) have been severed.
        # The per-cohort script feature will rewire this. Queue advancement
        # continues to work without prompt content.
        all_prompts: dict = {}

        # Create execution
        execution = StudyExecution(
            study_id=study_id,
            company_id=company_id,
            status="LOADING",
            cohort_interview_map=cohort_interview_map,
        )
        session.add(execution)
        await session.flush()  # get execution.id

        # Fetch participants with lead + cohort data
        stmt = (
            select(ResearchLead, ResearchParticipant, ResearchCohort)
            .join(ResearchParticipant, ResearchParticipant.lead_id == ResearchLead.id)
            .outerjoin(ResearchCohort, ResearchCohort.id == ResearchLead.cohort_id)
            .where(
                ResearchParticipant.study_id == study_id,
                ResearchParticipant.status.in_(["PENDING", "READY"]),
            )
            .order_by(ResearchLead.created_at.desc())
        )
        rows = (await session.exec(stmt)).all()

        if not rows:
            execution.status = "READY"
            session.add(execution)
            await session.commit()
            logger.warning(f"[StudyEngine] No participants found for study {study_id}")
            return execution

        # Duration → InterviewTypeKey mapping for prompt lookup
        duration_to_bucket = {15: "audioA", 30: "audioB", 60: "audioC"}

        # Expand leads into queue items
        created_count = 0
        for lead, participant, cohort in rows:
            cohort_name = cohort.name if cohort else "Unassigned"
            durations = cohort_interview_map.get(cohort_name, [])

            for duration in durations:
                bucket = duration_to_bucket.get(duration)
                prompt_key = f"{cohort_name}::{bucket}" if bucket else None
                prompt_text = (
                    all_prompts.get(prompt_key, {}).get("prompt", "")
                    if prompt_key
                    else ""
                )

                queue_item = StudyCallQueue(
                    execution_id=execution.id,
                    participant_id=participant.id,
                    lead_id=lead.id,
                    interview_type=duration,
                    cohort_name=cohort_name,
                    prompt_text=prompt_text,
                    status="PENDING",
                )
                session.add(queue_item)
                created_count += 1

        execution.status = "READY"
        session.add(execution)
        await session.commit()

        logger.info(
            f"[StudyEngine] Created execution {execution.id} with "
            f"{created_count} queue items from {len(rows)} participants"
        )
        return execution

    @staticmethod
    async def get_state(session: AsyncSession, execution_id: UUID) -> Dict[str, Any]:
        """
        Return the full pipeline state for the VoiceSandbox frontend.
        Same JSON shape as the simulated PromotionEngine.
        """
        execution = await session.get(StudyExecution, execution_id)
        if not execution:
            return {"running": False, "leads": {}, "agents": [], "activity": []}

        # Fetch all queue items with lead data
        stmt = (
            select(StudyCallQueue, ResearchLead)
            .join(ResearchLead, ResearchLead.id == StudyCallQueue.lead_id)
            .where(StudyCallQueue.execution_id == execution_id)
        )
        rows = (await session.exec(stmt)).all()
        all_items = [row[0] for row in rows]
        lead_map: Dict[UUID, ResearchLead] = {row[1].id: row[1] for row in rows}

        # Fetch recent call logs for activity stream
        log_stmt = (
            select(StudyCallLog)
            .where(StudyCallLog.execution_id == execution_id)
            .where(StudyCallLog.call_outcome.isnot(None))
            .order_by(StudyCallLog.updated_at.desc())
            .limit(50)
        )
        recent_logs = (await session.exec(log_stmt)).all()

        # Build leads grouped by cohort duration
        leads_by_cohort: Dict[int, Dict[str, Any]] = {}

        for duration, meta in COHORT_META.items():
            cohort_items = [i for i in all_items if i.interview_type == duration]

            waiting = [
                i for i in cohort_items if i.status in WAITING_STATUSES
            ]
            waiting.sort(key=lambda i: (i.priority_score, i.created_at.timestamp()), reverse=True)

            processing = [i for i in cohort_items if i.status == DIALING_STATUS]
            completed = [i for i in cohort_items if i.status in TERMINAL_STATUSES]

            leads_by_cohort[duration] = {
                **meta,
                "totalCount": len(cohort_items),
                "waiting": [_item_to_lead_dict(i, "waiting", lead_map) for i in waiting],
                "processing": [_item_to_lead_dict(i, "processing", lead_map) for i in processing],
                "completed": [_item_to_lead_dict(i, "completed", lead_map) for i in completed],
                "waitingCount": len(waiting),
                "processingCount": len(processing),
                "completedCount": len(completed),
            }

        # Build virtual agents (2 per active duration lane)
        agents = _build_virtual_agents(all_items)

        # Build activity stream from recent logs
        activity = []
        for log in recent_logs:
            qi = next((i for i in all_items if i.id == log.queue_item_id), None)
            lead = lead_map.get(log.lead_id)
            lead_name = f"{lead.first_name} {lead.last_name or ''}".strip() if lead else "Unknown"
            company = (lead.contact_profile or {}).get("company_name", "") if lead else ""

            activity.append({
                "id": str(log.id),
                "leadId": str(log.lead_id),
                "leadName": lead_name,
                "leadCompany": company,
                "cohort": qi.interview_type if qi else 0,
                "sentiment": _sentiment_from_outcome(log.call_outcome),
                "outcome": human_outcome(log.call_outcome or ""),
                "completedAt": log.updated_at.timestamp() * 1000 if log.updated_at else 0,
            })

        return {
            "running": execution.status == "ACTIVE",
            "leads": leads_by_cohort,
            "agents": agents,
            "activity": activity,
        }

    @staticmethod
    async def start(session: AsyncSession, execution_id: UUID):
        """Set execution to ACTIVE and promote initial batch to READY."""
        execution = await session.get(StudyExecution, execution_id)
        if not execution:
            raise ValueError(f"Execution {execution_id} not found")

        execution.status = "ACTIVE"
        execution.updated_at = datetime.utcnow()
        session.add(execution)

        # Promote some PENDING → READY
        max_concurrent = (execution.execution_config or {}).get("max_concurrent_calls", 2)
        buffer_size = max(5, max_concurrent * 4)

        stmt = (
            select(StudyCallQueue)
            .where(
                StudyCallQueue.execution_id == execution_id,
                StudyCallQueue.status == "PENDING",
            )
            .order_by(StudyCallQueue.priority_score.desc(), StudyCallQueue.created_at)
            .limit(buffer_size)
        )
        items = (await session.exec(stmt)).all()
        for item in items:
            item.status = "READY"
            item.updated_at = datetime.utcnow()
            session.add(item)

        await session.commit()
        logger.info(f"[StudyEngine] Started execution {execution_id}, promoted {len(items)} to READY")

    @staticmethod
    async def tick(session: AsyncSession, execution_id: UUID) -> Dict[str, Any]:
        """
        One cycle of the engine. Called by frontend polling every ~1.5s.

        Steps:
        1. Process webhook-updated completions
        2. Wake scheduled items past their time
        3. Replenish READY buffer from PENDING
        4. Promote one READY → DIALING and initiate Bolna call
        5. Return full state
        """
        execution = await session.get(StudyExecution, execution_id)
        if not execution or execution.status != "ACTIVE":
            return await StudyExecutionEngine.get_state(session, execution_id)

        max_concurrent = (execution.execution_config or {}).get("max_concurrent_calls", 2)

        # ── Step 1: Process completions ────────────────────────────
        # Find DIALING items whose latest call log has a terminal webhook
        dialing_stmt = select(StudyCallQueue).where(
            StudyCallQueue.execution_id == execution_id,
            StudyCallQueue.status == DIALING_STATUS,
        )
        dialing_items = (await session.exec(dialing_stmt)).all()

        for item in dialing_items:
            # Get the latest call log for this item
            log_stmt = (
                select(StudyCallLog)
                .where(StudyCallLog.queue_item_id == item.id)
                .order_by(StudyCallLog.created_at.desc())
                .limit(1)
            )
            log = (await session.exec(log_stmt)).first()
            if not log:
                continue

            # Check if the webhook has updated this log to a terminal state
            if not is_terminal_state(log.call_status, log.webhook_payload or {}):
                continue

            # Defer until the FINAL webhook has arrived. Bolna sends multiple
            # webhooks during a call; the truly final one always carries the
            # full transcript. Without it we'd process the call with partial
            # data (duration=0, no extracted_data) and misclassify the outcome.
            # Exception: technical-failure terminal states (no-answer, busy,
            # failed) never produce a transcript — process them immediately.
            non_transcript_terminals = {"no-answer", "busy", "failed", "canceled"}
            if (
                (log.call_status or "").lower() not in non_transcript_terminals
                and not log.full_transcript
            ):
                logger.info(
                    f"[StudyEngine] Deferring completion for {item.id} — "
                    f"terminal status received but transcript not yet present"
                )
                continue

            # Determine outcome
            outcome_status = determine_call_outcome(
                payload=log.webhook_payload or {},
                extracted_data=log.extracted_data or {},
                call_status=log.call_status,
                duration=log.call_duration,
                termination_reason=log.termination_reason or "",
            )

            log.call_outcome = outcome_status
            log.updated_at = datetime.utcnow()
            session.add(log)

            if should_retry(outcome_status, item.execution_count, log.call_duration):
                item.status = "SCHEDULED"
                item.scheduled_for = datetime.utcnow() + timedelta(minutes=RETRY_COOLDOWN_MINUTES)
                item.priority_score = 100
                item.outcome = f"Retry: {human_outcome(outcome_status)}"
                logger.info(f"[StudyEngine] Scheduling retry for {item.id}: {outcome_status}")
            else:
                item.status = outcome_status
                item.outcome = human_outcome(outcome_status)
                logger.info(f"[StudyEngine] Final outcome for {item.id}: {outcome_status}")

            item.updated_at = datetime.utcnow()
            session.add(item)

        # ── Step 2: Wake scheduled items ───────────────────────────
        now = datetime.utcnow()
        sched_stmt = select(StudyCallQueue).where(
            StudyCallQueue.execution_id == execution_id,
            StudyCallQueue.status == "SCHEDULED",
            StudyCallQueue.scheduled_for <= now,
        )
        scheduled_items = (await session.exec(sched_stmt)).all()
        for item in scheduled_items:
            item.status = "READY"
            item.scheduled_for = None
            item.updated_at = now
            session.add(item)
            logger.info(f"[StudyEngine] Woke scheduled item {item.id}")

        # ── Step 3: Replenish READY buffer ─────────────────────────
        ready_count_stmt = select(StudyCallQueue).where(
            StudyCallQueue.execution_id == execution_id,
            StudyCallQueue.status == "READY",
        )
        ready_count = len((await session.exec(ready_count_stmt)).all())
        buffer_target = max(5, max_concurrent * 4)

        if ready_count < buffer_target:
            needed = buffer_target - ready_count
            pending_stmt = (
                select(StudyCallQueue)
                .where(
                    StudyCallQueue.execution_id == execution_id,
                    StudyCallQueue.status == "PENDING",
                )
                .order_by(StudyCallQueue.priority_score.desc(), StudyCallQueue.created_at)
                .limit(needed)
            )
            pending_items = (await session.exec(pending_stmt)).all()
            for item in pending_items:
                item.status = "READY"
                item.updated_at = now
                session.add(item)

        # ── Step 4: Promote one READY → DIALING ───────────────────
        active_count_stmt = select(StudyCallQueue).where(
            StudyCallQueue.execution_id == execution_id,
            StudyCallQueue.status == DIALING_STATUS,
        )
        active_count = len((await session.exec(active_count_stmt)).all())

        if active_count < max_concurrent:
            # Get busy lead_ids (already in DIALING)
            busy_lead_ids = set()
            for di in dialing_items:
                busy_lead_ids.add(di.lead_id)

            # Pick best READY candidate
            candidate_stmt = (
                select(StudyCallQueue)
                .where(
                    StudyCallQueue.execution_id == execution_id,
                    StudyCallQueue.status == "READY",
                    StudyCallQueue.execution_count < MAX_EXECUTION_COUNT,
                )
                .order_by(StudyCallQueue.priority_score.desc(), StudyCallQueue.created_at)
            )
            candidates = (await session.exec(candidate_stmt)).all()

            promoted = None
            for candidate in candidates:
                # Skip if this lead already has an active call
                if candidate.lead_id in busy_lead_ids:
                    continue
                promoted = candidate
                break

            if promoted:
                promoted.status = DIALING_STATUS
                promoted.execution_count += 1
                promoted.updated_at = datetime.utcnow()
                session.add(promoted)

                # COMMIT before Bolna call (critical safety point)
                await session.commit()

                # Fetch lead and initiate call
                lead = await session.get(ResearchLead, promoted.lead_id)
                if lead:
                    result = await initiate_call(session, promoted, lead, execution)
                    if result["status"] == "error":
                        promoted.status = "FAILED_CONNECT"
                        promoted.outcome = result.get("error", "Call initiation failed")
                        promoted.updated_at = datetime.utcnow()
                        session.add(promoted)
                        logger.error(f"[StudyEngine] Call failed for {promoted.id}: {result['error']}")

        await session.commit()

        # ── Step 5: Check completion ───────────────────────────────
        remaining_stmt = select(StudyCallQueue).where(
            StudyCallQueue.execution_id == execution_id,
            StudyCallQueue.status.in_(["PENDING", "READY", "DIALING", "SCHEDULED"]),
        )
        remaining = len((await session.exec(remaining_stmt)).all())
        if remaining == 0 and execution.status == "ACTIVE":
            execution.status = "COMPLETED"
            execution.updated_at = datetime.utcnow()
            session.add(execution)
            await session.commit()
            logger.info(f"[StudyEngine] Execution {execution_id} completed!")

        return await StudyExecutionEngine.get_state(session, execution_id)

    @staticmethod
    async def pause(session: AsyncSession, execution_id: UUID):
        """Pause the execution. Tick will skip promotion but still process completions."""
        execution = await session.get(StudyExecution, execution_id)
        if execution:
            execution.status = "PAUSED"
            execution.updated_at = datetime.utcnow()
            session.add(execution)
            await session.commit()
            logger.info(f"[StudyEngine] Paused execution {execution_id}")

    @staticmethod
    async def reset(session: AsyncSession, execution_id: UUID):
        """Reset all queue items to PENDING and clear call logs."""
        execution = await session.get(StudyExecution, execution_id)
        if not execution:
            return

        # Reset queue items
        stmt = select(StudyCallQueue).where(
            StudyCallQueue.execution_id == execution_id
        )
        items = (await session.exec(stmt)).all()
        for item in items:
            item.status = "PENDING"
            item.execution_count = 0
            item.priority_score = 0
            item.outcome = None
            item.scheduled_for = None
            item.updated_at = datetime.utcnow()
            session.add(item)

        # Delete call logs
        from sqlalchemy import delete
        await session.exec(
            delete(StudyCallLog).where(StudyCallLog.execution_id == execution_id)
        )

        execution.status = "READY"
        execution.updated_at = datetime.utcnow()
        session.add(execution)
        await session.commit()
        logger.info(f"[StudyEngine] Reset execution {execution_id}")


# ── Helpers ────────────────────────────────────────────────────────

def _item_to_lead_dict(
    item: StudyCallQueue, status_label: str, lead_map: Dict[UUID, ResearchLead]
) -> dict:
    """Convert a StudyCallQueue item to the Lead dict shape the frontend expects."""
    lead = lead_map.get(item.lead_id)
    name = f"{lead.first_name} {lead.last_name or ''}".strip() if lead else "Unknown"
    company = (lead.contact_profile or {}).get("company_name", "") if lead else ""
    return {
        "id": f"{item.lead_id}:{item.interview_type}",
        "queueItemId": str(item.id),
        "name": name,
        "company": company,
        "score": item.priority_score or 50,
        "cohort": item.interview_type,
        "cohortName": item.cohort_name,
        "contactNumber": None,
        "status": status_label,
        "assignedAgentId": None,
        "sentiment": None,
        "completedAt": int(item.updated_at.timestamp() * 1000) if item.status in TERMINAL_STATUSES else None,
        "executionCount": item.execution_count,
        "priorityScore": item.priority_score,
    }


def _build_virtual_agents(all_items: list) -> list:
    """Create virtual agent entries for the frontend, 2 per active duration lane."""
    active_durations = set(i.interview_type for i in all_items)
    agents = []
    name_idx = 0

    for duration in sorted(active_durations):
        meta = COHORT_META.get(duration, {"label": f"{duration}-Min Interview"})
        label = meta.get("label", f"{duration}-Min Interview")

        for _ in range(2):
            name = AGENT_NAMES[name_idx % len(AGENT_NAMES)]

            # Check if this agent slot has an active call
            dialing_for_duration = [
                i for i in all_items
                if i.interview_type == duration and i.status == DIALING_STATUS
            ]
            is_busy = name_idx < len(dialing_for_duration)
            current_lead_id = (
                f"{dialing_for_duration[name_idx].lead_id}:{duration}"
                if is_busy and name_idx < len(dialing_for_duration)
                else None
            )

            agents.append({
                "id": f"agent-{name.lower()}-{duration}",
                "name": name,
                "role": label,
                "duration": duration,
                "status": "processing" if current_lead_id else "idle",
                "currentLeadId": current_lead_id,
            })
            name_idx += 1

    return agents


def _sentiment_from_outcome(outcome: Optional[str]) -> str:
    """Derive a simple sentiment label from a call outcome."""
    if not outcome:
        return "Neutral"
    positive = {"INTENT_YES", "SCHEDULED", "COMPLETED"}
    negative = {"INTENT_NO", "DNC", "WRONG_PERSON", "FAILED_CONNECT"}
    if outcome in positive:
        return "Positive"
    if outcome in negative:
        return "Negative"
    return "Neutral"
