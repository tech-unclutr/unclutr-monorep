import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import text
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_session
from app.core.security import get_current_user
from app.models.designed_study import DesignedStudy
from app.models.iam import CompanyMembership
from app.models.study_designer import (
    ResearchCohort,
    ResearchLead,
    ResearchParticipant,
)
from app.models.user import User
from app.services.agent_execution import trigger_bolna_call
from app.services.intelligence.agent_prompt_generator import generate_agent_prompt

router = APIRouter()


# ── Auth helper ──

async def _get_company_id(
    session: AsyncSession = Depends(get_session),
    current_user_token: dict = Depends(get_current_user),
) -> uuid.UUID:
    user_id = current_user_token.get("uid")
    user = await session.get(User, user_id)
    if user and user.current_company_id:
        return user.current_company_id
    stmt = select(CompanyMembership).where(CompanyMembership.user_id == user_id)
    membership = (await session.exec(stmt)).first()
    if not membership:
        raise HTTPException(status_code=404, detail="No company found for user")
    return membership.company_id


# ── Schemas ──

class AgentPromptResponse(BaseModel):
    prompt: str
    generated_at: Optional[datetime] = None


class CohortPromptEntry(BaseModel):
    cohort_id: uuid.UUID
    cohort_name: str
    prompt: Optional[str] = None
    generated_at: Optional[datetime] = None


class CohortPromptsResponse(BaseModel):
    cohorts: List[CohortPromptEntry]


class TriggerCallRequest(BaseModel):
    # Optional — when present, gets stamped on the new study_call_logs row so
    # the Phase 1 webhook handler can resolve the GCS object path without
    # joining back through research_participants.
    study_id: Optional[uuid.UUID] = None


class TriggerCallResponse(BaseModel):
    status: str
    call_id: Optional[str] = None
    agent_id: Optional[uuid.UUID] = None
    agent_name: Optional[str] = None
    lead_id: Optional[uuid.UUID] = None
    payload: dict
    response: Optional[dict] = None
    error: Optional[str] = None
    log_persisted: Optional[bool] = None


class RecentCallEntry(BaseModel):
    call_id: str
    lead_id: uuid.UUID
    lead_first_name: str
    lead_last_name: Optional[str] = None
    agent_id: Optional[uuid.UUID] = None
    call_status: str
    call_duration: int = 0
    recording_url: Optional[str] = None
    error_message: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_terminal: bool


TERMINAL_CALL_STATES = {
    "completed",
    "failed",
    "call-disconnected",
    "voicemail_detected",
    "no-answer",
    "busy",
    "canceled",
    "error",
}


# ── Endpoints ──

@router.get(
    "/studies/{study_id}/cohort-prompts",
    response_model=CohortPromptsResponse,
)
async def get_all_cohort_prompts(
    study_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Return every cohort's stored agent prompt for this study in one shot.

    Scoped to cohorts that have at least one participant in this study so we
    don't leak unrelated company cohorts. Read-only — never triggers
    generation. A null prompt means the cohort hasn't had its prompt
    generated yet.
    """
    study = await session.get(DesignedStudy, study_id)
    if not study or study.company_id != company_id:
        raise HTTPException(status_code=404, detail="Study not found")

    # Subquery: cohort_ids referenced by this study's participants. IN (subquery)
    # rather than DISTINCT on the join because ResearchCohort.meta_data is JSON
    # and Postgres can't apply DISTINCT to rows with JSON columns.
    referenced_cohort_ids = (
        select(ResearchLead.cohort_id)
        .join(ResearchParticipant, ResearchParticipant.lead_id == ResearchLead.id)
        .where(
            ResearchParticipant.study_id == study_id,
            ResearchLead.cohort_id.isnot(None),
        )
    )
    stmt = (
        select(ResearchCohort)
        .where(
            ResearchCohort.company_id == company_id,
            ResearchCohort.id.in_(referenced_cohort_ids),
        )
        .order_by(ResearchCohort.name)
    )
    cohorts = (await session.exec(stmt)).all()

    return CohortPromptsResponse(
        cohorts=[
            CohortPromptEntry(
                cohort_id=c.id,
                cohort_name=c.name,
                prompt=c.voice_agent_prompt,
                generated_at=c.voice_agent_prompt_generated_at,
            )
            for c in cohorts
        ]
    )


@router.get(
    "/studies/{study_id}/cohorts/{cohort_id}/agent-prompt",
    response_model=AgentPromptResponse,
)
async def get_cohort_agent_prompt(
    study_id: uuid.UUID,
    cohort_id: uuid.UUID,
    regenerate: bool = False,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Return the Bolna voice agent prompt for one cohort.

    Cached on `research_cohorts.voice_agent_prompt`. First read (or
    `?regenerate=true`) runs the meta-prompt LLM call (20-90s) and persists
    the result; subsequent reads return the stored prompt instantly.
    """
    study = await session.get(DesignedStudy, study_id)
    if not study or study.company_id != company_id:
        raise HTTPException(status_code=404, detail="Study not found")

    cohort = await session.get(ResearchCohort, cohort_id)
    if not cohort or cohort.company_id != company_id:
        raise HTTPException(status_code=404, detail="Cohort not found")

    if cohort.voice_agent_prompt and not regenerate:
        return AgentPromptResponse(
            prompt=cohort.voice_agent_prompt,
            generated_at=cohort.voice_agent_prompt_generated_at,
        )

    try:
        result = await generate_agent_prompt(session, study, cohort)
    except TimeoutError:
        logger.error("Gemini request timed out (agent prompt generation)")
        raise HTTPException(status_code=504, detail="Agent prompt generation timed out")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Agent prompt generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    cohort.voice_agent_prompt = result.prompt
    cohort.voice_agent_prompt_generated_at = datetime.utcnow()
    session.add(cohort)
    await session.commit()
    await session.refresh(cohort)

    return AgentPromptResponse(
        prompt=cohort.voice_agent_prompt,
        generated_at=cohort.voice_agent_prompt_generated_at,
    )


@router.get(
    "/studies/{study_id}/recent-calls",
    response_model=List[RecentCallEntry],
)
async def get_recent_study_calls(
    study_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Latest StudyCallLog row per lead for this study.

    Powers the ExecutionPage poller — used to migrate active calls into the
    Completed section once they reach a terminal status (and to surface the
    recording URL + duration once available).
    """
    study = await session.get(DesignedStudy, study_id)
    if not study or study.company_id != company_id:
        raise HTTPException(status_code=404, detail="Study not found")

    sql = text(
        """
        WITH study_lead_ids AS (
            SELECT rl.id AS lead_id,
                   rl.first_name,
                   rl.last_name,
                   rc.agent_configuration_id
            FROM research_leads rl
            JOIN research_participants rp ON rp.lead_id = rl.id
            LEFT JOIN research_cohorts rc ON rc.id = rl.cohort_id
            WHERE rp.study_id = :study_id
              AND rl.company_id = :company_id
        ),
        latest AS (
            SELECT DISTINCT ON (scl.lead_id)
                   scl.lead_id,
                   scl.bolna_call_id,
                   scl.call_status,
                   scl.call_duration,
                   scl.recording_url,
                   scl.termination_reason,
                   scl.transcript_summary,
                   scl.webhook_payload->>'summary' AS bolna_summary,
                   scl.created_at,
                   scl.updated_at
            FROM study_call_logs scl
            JOIN study_lead_ids sli ON sli.lead_id = scl.lead_id
            ORDER BY scl.lead_id, scl.created_at DESC
        )
        SELECT l.lead_id,
               sli.first_name,
               sli.last_name,
               sli.agent_configuration_id,
               l.bolna_call_id,
               l.call_status,
               l.call_duration,
               l.recording_url,
               l.termination_reason,
               l.bolna_summary,
               l.transcript_summary,
               l.created_at,
               l.updated_at
        FROM latest l
        JOIN study_lead_ids sli ON sli.lead_id = l.lead_id
        ORDER BY l.updated_at DESC
        """
    )
    rows = (
        await session.execute(sql, {"study_id": study_id, "company_id": company_id})
    ).mappings().all()

    out: List[RecentCallEntry] = []
    for r in rows:
        status = (r["call_status"] or "").lower()
        out.append(
            RecentCallEntry(
                call_id=r["bolna_call_id"],
                lead_id=r["lead_id"],
                lead_first_name=r["first_name"] or "",
                lead_last_name=r["last_name"],
                agent_id=r["agent_configuration_id"],
                call_status=r["call_status"] or "unknown",
                call_duration=r["call_duration"] or 0,
                recording_url=r["recording_url"],
                error_message=r["termination_reason"],
                summary=r["bolna_summary"] or r["transcript_summary"],
                created_at=r["created_at"],
                updated_at=r["updated_at"],
                is_terminal=status in TERMINAL_CALL_STATES,
            )
        )
    return out


@router.post(
    "/leads/{lead_id}/call",
    response_model=TriggerCallResponse,
)
async def trigger_call(
    lead_id: uuid.UUID,
    body: TriggerCallRequest = TriggerCallRequest(),
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Place a single Bolna call for one research lead.

    Loads the lead's cohort prompt, resolves the agent persona, substitutes
    runtime placeholders, POSTs to Bolna's /call endpoint, and records a row
    in `study_call_logs`. Returns the payload (for verification), Bolna's
    response, and `agent_id` so the frontend can slot the lead under the
    right agent card.

    The optional `study_id` in the request body is stamped on the new
    `study_call_logs` row so the insights-pipeline webhook handler can
    address its GCS object path without re-joining through participants.
    """
    return await trigger_bolna_call(session, lead_id, company_id, body.study_id)
