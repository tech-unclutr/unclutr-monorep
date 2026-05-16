"""
Agent execution — Bolna /call trigger for a single research lead.

Loads the lead + its cohort's voice_agent_prompt, resolves the agent persona,
substitutes runtime placeholders, POSTs to Bolna, and logs the call in
`study_call_logs`. Self-contained — does not share helpers with the legacy
campaign-based `bolna_caller.py`.
"""

import re
from typing import Any, Dict, Optional
from uuid import UUID

import httpx
import phonenumbers
from fastapi import HTTPException
from loguru import logger
from sqlalchemy.exc import IntegrityError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.company import Company
from app.models.study_designer import (
    ResearchCohort,
    ResearchLead,
    StudyCallLog,
)
from app.services.agent_resolver import resolve_for_cohort


_BOLNA_TIMEOUT_SECONDS = 15.0
_PLACEHOLDER_PATTERN = re.compile(r"\{[a-z_]+\}")


def _normalize_phone(raw: str) -> str:
    """Parse to E.164 via libphonenumber. Requires a country code (either a
    leading `+` or a digit prefix that libphonenumber recognizes) so US, UK,
    IN, etc. all route correctly. Defaulting to a single region silently
    misroutes numbers from every other region."""
    if not raw or not raw.strip():
        raise HTTPException(status_code=400, detail="Lead has no contact number")

    candidate = raw.strip()
    if not candidate.startswith("+"):
        digits = re.sub(r"\D", "", candidate)
        candidate = f"+{digits}"

    try:
        parsed = phonenumbers.parse(candidate, None)
    except phonenumbers.NumberParseException as exc:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid phone number {raw!r}: include country code "
                f"(e.g. +1 for US, +91 for India). {exc}"
            ),
        ) from exc

    if not phonenumbers.is_valid_number(parsed):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid phone number {raw!r}: include country code "
                "(e.g. +1 for US, +91 for India)."
            ),
        )

    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def _substitute_runtime_vars(
    prompt: str,
    participant_name: str,
    agent_name: str,
    company_name: str,
) -> str:
    """Replace per-call placeholders. Uses str.replace (not str.format) — the
    template contains literal `{` characters in Devanagari interpolation hints
    so .format would KeyError."""
    out = prompt
    out = out.replace("{participant_name}", participant_name or "")
    out = out.replace("{agent_name}", agent_name or "")
    out = out.replace("{company_name}", company_name or "")
    return out


async def trigger_bolna_call(
    session: AsyncSession,
    lead_id: UUID,
    company_id: UUID,
    study_id: Optional[UUID] = None,
) -> Dict[str, Any]:
    """
    Triggers a single Bolna /call for the given lead.

    Returns a dict with `status` ("success" | "error"), `payload` (always
    echoed for verification), and on success `call_id`, `agent_id`,
    `agent_name`, `lead_id`, `response`, `log_persisted`.
    """

    if not settings.BOLNA_API_KEY or not settings.BOLNA_AGENT_ID:
        raise HTTPException(status_code=500, detail="Bolna not configured")

    lead = await session.get(ResearchLead, lead_id)
    if not lead or lead.company_id != company_id:
        raise HTTPException(status_code=404, detail="Lead not found")

    if not lead.cohort_id:
        raise HTTPException(status_code=400, detail="Lead has no cohort")
    cohort = await session.get(ResearchCohort, lead.cohort_id)
    if not cohort or cohort.company_id != company_id:
        raise HTTPException(status_code=404, detail="Cohort not found")
    if not cohort.voice_agent_prompt:
        raise HTTPException(
            status_code=400,
            detail="Voice agent prompt not generated for this cohort",
        )

    company = await session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    agent = await resolve_for_cohort(session, cohort)

    resolved_prompt = _substitute_runtime_vars(
        cohort.voice_agent_prompt,
        participant_name=lead.first_name,
        agent_name=agent.name,
        company_name=company.brand_name,
    )

    leftover = _PLACEHOLDER_PATTERN.findall(resolved_prompt)
    if leftover:
        logger.warning(
            f"[AgentExecution] Prompt has unsubstituted placeholders after "
            f"resolution: {sorted(set(leftover))}"
        )

    payload = {
        "recipient_phone_number": _normalize_phone(lead.contact_number),
        "agent_id": settings.BOLNA_AGENT_ID,
        "user_data": {
            "prompt": resolved_prompt,
            "participant_name": lead.first_name,
            "agent_name": agent.name,
            "company_name": company.brand_name,
        },
    }

    url = f"{settings.BOLNA_API_BASE_URL}/call"
    headers = {"Authorization": f"Bearer {settings.BOLNA_API_KEY}"}

    user_data = payload.get("user_data", {})
    prompt_len = len(user_data.get("prompt", "") or "")
    logger.info(
        f"[AgentExecution] POST {url} "
        f"recipient={payload.get('recipient_phone_number')} "
        f"agent_id={payload.get('agent_id')} "
        f"participant_name={user_data.get('participant_name')} "
        f"agent_name={user_data.get('agent_name')} "
        f"company_name={user_data.get('company_name')} "
        f"prompt_len={prompt_len}"
    )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=payload, headers=headers, timeout=_BOLNA_TIMEOUT_SECONDS
            )
            response.raise_for_status()
            response_json = response.json()
            logger.info(
                f"[AgentExecution] Bolna response status={response.status_code} body={response_json}"
            )
    except httpx.HTTPStatusError as e:
        body = ""
        try:
            body = e.response.text
        except Exception:
            pass
        err_msg = f"Bolna API {e.response.status_code}: {body}"
        logger.error(f"[AgentExecution] {err_msg}")
        return {"status": "error", "payload": payload, "error": err_msg}
    except Exception as e:
        logger.error(f"[AgentExecution] Bolna request failed: {e}")
        return {"status": "error", "payload": payload, "error": str(e)}

    bolna_call_id = (
        response_json.get("execution_id")
        or response_json.get("run_id")
        or response_json.get("call_id")
        or response_json.get("id")
    )
    if not bolna_call_id:
        logger.error(
            f"[AgentExecution] Bolna response missing call id: {response_json}"
        )
        return {
            "status": "error",
            "payload": payload,
            "response": response_json,
            "error": "Bolna response missing call id",
        }

    log_persisted = await _persist_log(
        session=session,
        lead_id=lead.id,
        bolna_call_id=str(bolna_call_id),
        response_json=response_json,
        company_id=company_id,
        study_id=study_id,
    )

    agent_id: Optional[UUID] = cohort.agent_configuration_id

    return {
        "status": "success",
        "call_id": str(bolna_call_id),
        "agent_id": agent_id,
        "agent_name": agent.name,
        "lead_id": lead.id,
        "payload": payload,
        "response": response_json,
        "log_persisted": log_persisted,
    }


async def _persist_log(
    session: AsyncSession,
    lead_id: UUID,
    bolna_call_id: str,
    response_json: Dict[str, Any],
    company_id: Optional[UUID] = None,
    study_id: Optional[UUID] = None,
) -> bool:
    """Insert one row in study_call_logs. Returns False (without raising) when
    the write fails — usually due to the deferred migration that still has
    NOT NULL on execution_id/queue_item_id, or a duplicate bolna_call_id.

    `company_id` and `study_id` are stamped on every new row so the Phase 1
    GCS-stash path in the webhook handler has them available without a join
    back through research_leads / research_participants.
    """
    log = StudyCallLog(
        lead_id=lead_id,
        bolna_call_id=bolna_call_id,
        bolna_agent_id=settings.BOLNA_AGENT_ID or "unknown",
        call_status="initiated",
        webhook_payload=response_json,
        company_id=company_id,
        study_id=study_id,
    )
    session.add(log)
    try:
        await session.commit()
        return True
    except IntegrityError as e:
        await session.rollback()
        logger.warning(
            f"[AgentExecution] study_call_logs insert failed (IntegrityError): {e}. "
            f"Call placed successfully; log row skipped."
        )
        return False
    except Exception as e:
        await session.rollback()
        logger.error(
            f"[AgentExecution] study_call_logs insert failed unexpectedly: {e}"
        )
        return False
