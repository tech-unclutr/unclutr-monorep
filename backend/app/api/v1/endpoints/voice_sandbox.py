import random
from typing import Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_session
from app.models.designed_study import DesignedStudy
from app.models.study_designer import ResearchCohort, ResearchLead, ResearchParticipant
from app.services.voice_sandbox.lead_queue import Lead
from app.services.voice_sandbox.promotion_engine import engine

router = APIRouter()


# ── Request schema ─────────────────────────────────────────────────

class LoadRequest(BaseModel):
    """Maps each cohort name to the interview durations it participates in."""
    cohort_interview_map: Dict[str, List[int]]  # e.g. {"Gen Z": [15, 60], "Pros": [15, 30, 60]}


# ── Helpers ────────────────────────────────────────────────────────

async def _fetch_and_load_leads(
    study_id: UUID,
    cohort_interview_map: Dict[str, List[int]],
    session: AsyncSession,
):
    """Fetch leads from DB, expand into per-interview-type entries, load into engine."""
    study = await session.get(DesignedStudy, study_id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

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
        raise HTTPException(status_code=404, detail="No leads found for this study")

    # Expand leads: one entry per (lead × interview duration)
    leads: list[Lead] = []
    for lead, participant, cohort in rows:
        cohort_name = cohort.name if cohort else "Unassigned"
        durations = cohort_interview_map.get(cohort_name, [])

        if not durations:
            continue

        company = (lead.contact_profile or {}).get("company_name", "")
        name = f"{lead.first_name} {lead.last_name or ''}".strip()
        score = random.randint(40, 95)  # score not in DB yet — randomize for sandbox

        for duration in durations:
            leads.append(Lead(
                id=f"{lead.id}:{duration}",
                name=name,
                company=company,
                score=score,
                cohort=duration,
                contact_number=lead.contact_number,
                cohort_name=cohort_name,
            ))

    if not leads:
        raise HTTPException(
            status_code=400,
            detail="No leads matched the cohort_interview_map. Check that cohort names match.",
        )

    engine.load_leads(leads)

    logger.info(
        f"[VoiceSandbox] Loaded {len(leads)} queue entries "
        f"from {len(rows)} leads for study {study_id}"
    )


# ── Endpoints ──────────────────────────────────────────────────────

@router.get("/state")
async def get_state():
    """Returns the full current state for the frontend to render."""
    return engine.get_state()


@router.post("/tick")
async def tick():
    """
    One engine cycle: check completions, promote leads.
    Frontend polls this every ~1.5s.
    """
    return engine.tick()


@router.post("/load/{study_id}")
async def load_study_leads(
    study_id: UUID,
    req: LoadRequest,
    session: AsyncSession = Depends(get_session),
):
    """Load leads from DB into the engine without starting. Populates the pipeline view."""
    await _fetch_and_load_leads(study_id, req.cohort_interview_map, session)
    return engine.get_state()


@router.post("/start")
async def start():
    """Start the promotion engine (leads must already be loaded)."""
    engine.start()
    return engine.tick()


@router.post("/stop")
async def stop():
    """Pause the promotion engine."""
    engine.stop()
    return engine.get_state()


@router.post("/reset")
async def reset():
    """Reset all state back to loaded leads."""
    engine.reset()
    return engine.get_state()
