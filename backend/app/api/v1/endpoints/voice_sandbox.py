"""
Voice Sandbox API — Study Execution Endpoints

Drives the VoiceSandbox frontend via StudyExecutionEngine.
All lead data comes from the database, routed through Bolna for real calls.
"""

from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_session
from app.models.company import Company
from app.models.designed_study import DesignedStudy
from app.models.study_designer.research_cohort import ResearchCohort
from app.models.study_designer.research_lead import ResearchLead
from app.models.study_designer.study_call_log import StudyCallLog
from app.models.study_designer.study_call_queue import StudyCallQueue
from app.models.study_designer.study_execution import StudyExecution
from app.models.user import User
from app.services.study_execution.engine import StudyExecutionEngine
from app.services.agent_resolver import resolve_for_cohort_id
from app.services.study_execution.prompt_resolver import resolve_runtime_vars

router = APIRouter()

# ── Module-level state: tracks the active execution ID ─────────────
_active_execution_id: Optional[UUID] = None


# ── Request schemas ────────────────────────────────────────────────

class LoadRequest(BaseModel):
    cohort_interview_map: Dict[str, List[int]]
    company_id: Optional[str] = None


# ── Endpoints ──────────────────────────────────────────────────────

@router.get("/state")
async def get_state(session: AsyncSession = Depends(get_session)):
    """Returns the full current state for the frontend to render."""
    if not _active_execution_id:
        return {"running": False, "leads": {}, "agents": [], "activity": []}
    return await StudyExecutionEngine.get_state(session, _active_execution_id)


@router.post("/tick")
async def tick(session: AsyncSession = Depends(get_session)):
    """One engine cycle: process completions, promote leads, initiate calls."""
    if not _active_execution_id:
        return {"running": False, "leads": {}, "agents": [], "activity": []}
    return await StudyExecutionEngine.tick(session, _active_execution_id)


@router.post("/load/{study_id}")
async def load_study(
    study_id: UUID,
    req: LoadRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Resume the most recent execution for this study, or create a new one if none exists.
    Resuming means the activity stream, completed calls, and pipeline state are preserved.
    """
    global _active_execution_id

    from app.models.designed_study import DesignedStudy
    study = await session.get(DesignedStudy, study_id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    company_id = UUID(req.company_id) if req.company_id else study.company_id

    # Check for an existing execution for this study (most recent non-LOADING one)
    existing_stmt = (
        select(StudyExecution)
        .where(
            StudyExecution.study_id == study_id,
            StudyExecution.status != "LOADING",
        )
        .order_by(StudyExecution.created_at.desc())
        .limit(1)
    )
    existing_execution = (await session.exec(existing_stmt)).first()

    if existing_execution:
        # Resume — reuse the existing execution and its queue/logs
        _active_execution_id = existing_execution.id
        # If it was ACTIVE before (server restart mid-run), move to PAUSED
        # so the user can consciously restart rather than having calls fire immediately
        if existing_execution.status == "ACTIVE":
            existing_execution.status = "PAUSED"
            existing_execution.updated_at = datetime.utcnow()
            session.add(existing_execution)
            await session.commit()
        logger.info(f"[VoiceSandbox] Resumed execution {existing_execution.id} for study {study_id}")
        return await StudyExecutionEngine.get_state(session, existing_execution.id)

    # No prior execution — create a fresh one
    try:
        execution = await StudyExecutionEngine.create_execution(
            session=session,
            study_id=study_id,
            company_id=company_id,
            cohort_interview_map=req.cohort_interview_map,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    _active_execution_id = execution.id
    logger.info(f"[VoiceSandbox] Created execution {execution.id} for study {study_id}")

    return await StudyExecutionEngine.get_state(session, execution.id)


@router.post("/start")
async def start(session: AsyncSession = Depends(get_session)):
    """Start the execution engine (leads must already be loaded)."""
    if not _active_execution_id:
        raise HTTPException(status_code=400, detail="No execution loaded. Call /load first.")

    await StudyExecutionEngine.start(session, _active_execution_id)
    return await StudyExecutionEngine.tick(session, _active_execution_id)


@router.post("/stop")
async def stop(session: AsyncSession = Depends(get_session)):
    """Pause the execution engine."""
    if not _active_execution_id:
        return {"running": False, "leads": {}, "agents": [], "activity": []}

    await StudyExecutionEngine.pause(session, _active_execution_id)
    return await StudyExecutionEngine.get_state(session, _active_execution_id)


@router.post("/reset")
async def reset(session: AsyncSession = Depends(get_session)):
    """Reset all state back to loaded leads."""
    if not _active_execution_id:
        return {"running": False, "leads": {}, "agents": [], "activity": []}

    await StudyExecutionEngine.reset(session, _active_execution_id)
    return await StudyExecutionEngine.get_state(session, _active_execution_id)


@router.get("/queue-item/{queue_item_id}/resolved-prompt")
async def get_resolved_prompt(
    queue_item_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """
    Return the fully resolved prompt for a queue item — with every
    runtime placeholder filled in using the specific lead's data.
    Used by the lead-card modal in the VoiceSandbox frontend.
    """
    queue_item = await session.get(StudyCallQueue, queue_item_id)
    if not queue_item:
        raise HTTPException(status_code=404, detail="Queue item not found")

    lead = await session.get(ResearchLead, queue_item.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    execution = await session.get(StudyExecution, queue_item.execution_id)
    study = await session.get(DesignedStudy, execution.study_id) if execution else None
    company = await session.get(Company, study.company_id) if study else None
    user = await session.get(User, study.user_id) if study and study.user_id else None

    agent = (
        await resolve_for_cohort_id(session, lead.cohort_id, study.company_id)
        if study
        else None
    )

    cohort = (
        await session.get(ResearchCohort, lead.cohort_id)
        if lead.cohort_id
        else None
    )

    resolved = resolve_runtime_vars(
        queue_item.prompt_text or "",
        lead=lead,
        study=study,
        company=company,
        user=user,
        agent=agent,
        incentive=cohort.incentive if cohort else "No Incentive",
    )
    return {"prompt": resolved}


@router.get("/call-log/{call_log_id}")
async def get_call_log_details(
    call_log_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """
    Return the recording, transcript, summary, and extracted data for
    a single completed call. Used by the activity-stream details modal.
    """
    import json

    call_log = await session.get(StudyCallLog, call_log_id)
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log not found")

    # Lead context for the modal header
    lead = await session.get(ResearchLead, call_log.lead_id)
    lead_name = (
        f"{lead.first_name} {lead.last_name or ''}".strip()
        if lead else "Unknown"
    )
    lead_company = (lead.contact_profile or {}).get("company_name", "") if lead else ""
    lead_phone = lead.contact_number if lead else None

    # Bolna stores transcript as either a JSON string of a list/dict, or plain text.
    # We always return the raw string — the frontend's transcript parser handles both.
    transcript_raw = call_log.full_transcript or ""

    # Try to parse as JSON for structured form; fall back to raw string.
    transcript_parsed = None
    if transcript_raw:
        try:
            parsed = json.loads(transcript_raw)
            if isinstance(parsed, list):
                transcript_parsed = parsed
        except (ValueError, TypeError):
            pass

    return {
        "id": str(call_log.id),
        "lead": {
            "id": str(call_log.lead_id),
            "name": lead_name,
            "company": lead_company,
            "phone": lead_phone,
        },
        "bolna_call_id": call_log.bolna_call_id,
        "call_status": call_log.call_status,
        "call_outcome": call_log.call_outcome,
        "call_duration": call_log.call_duration,
        "total_cost": call_log.total_cost,
        "currency": call_log.currency,
        "recording_url": call_log.recording_url,
        "transcript_summary": call_log.transcript_summary,
        "transcript_raw": transcript_raw,
        "transcript_turns": transcript_parsed,
        "extracted_data": call_log.extracted_data,
        "termination_reason": call_log.termination_reason,
        "created_at": call_log.created_at.isoformat() if call_log.created_at else None,
        "updated_at": call_log.updated_at.isoformat() if call_log.updated_at else None,
    }
