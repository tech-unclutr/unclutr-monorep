"""
Study Execution — Bolna API Caller

Initiates voice calls via the Bolna API. Self-contained — does not import
from the campaign-based bolna_caller.py, but uses the same user_data shape
so the existing Bolna agent template works unchanged.
"""

from datetime import datetime
from uuid import uuid4

import httpx
import phonenumbers
import pytz
from loguru import logger
from sqlmodel import desc, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.company import Company
from app.models.designed_study import DesignedStudy
from app.models.study_designer.research_lead import ResearchLead
from app.models.study_designer.study_call_log import StudyCallLog
from app.models.study_designer.study_call_queue import StudyCallQueue
from app.models.study_designer.study_execution import StudyExecution
from app.models.user import User
from app.services.study_execution.prompt_resolver import resolve_runtime_vars


# ── Phone normalization ───────────────────────────────────────────

def normalize_phone_number(raw: str, default_region: str = "US") -> str:
    """
    Parse any phone format into E.164 using the phonenumbers library.

    1. If the number starts with '+', parse without a default region.
    2. Otherwise, parse with the given default_region (ISO 3166-1 alpha-2).
    3. Validate the number is possible.
    4. Return E.164 format (e.g. "+14155552671").

    Raises ValueError if the number cannot be parsed or is invalid.
    """
    cleaned = raw.strip()
    if not cleaned:
        raise ValueError("Empty phone number")

    try:
        if cleaned.startswith("+"):
            parsed = phonenumbers.parse(cleaned, None)
        else:
            parsed = phonenumbers.parse(cleaned, default_region)
    except phonenumbers.NumberParseException as e:
        raise ValueError(f"Cannot parse phone number '{raw}': {e}")

    if not phonenumbers.is_possible_number(parsed):
        raise ValueError(f"Phone number '{raw}' is not a valid number")

    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


# ── Webhook URL resolution ────────────────────────────────────────

async def _resolve_webhook_url() -> str:
    """
    Build the webhook URL for Bolna callbacks.
    Production: {BACKEND_URL}/api/v1/webhook/study-bolna
    Dev: auto-detect Ngrok tunnel, fall back to BACKEND_URL.
    """
    webhook_path = f"{settings.API_V1_STR}/webhook/study-bolna"
    base_url = settings.BACKEND_URL

    if not settings.is_production:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get("http://localhost:4040/api/tunnels", timeout=0.5)
                if resp.status_code == 200:
                    tunnels = resp.json().get("tunnels", [])
                    public_url = next(
                        (t["public_url"] for t in tunnels if t["proto"] == "https"),
                        None,
                    )
                    if public_url:
                        base_url = public_url
                        logger.info(f"[StudyCaller] Ngrok detected: {base_url}")
        except Exception:
            pass

    url = f"{base_url}{webhook_path}"
    logger.info(f"[StudyCaller] Webhook URL: {url}")
    return url


# ── Helpers ───────────────────────────────────────────────────────

def _human_readable_duration(seconds: int) -> str:
    """Convert seconds to natural string like '10 minutes'."""
    if not seconds or seconds <= 0:
        return "0 seconds"
    minutes = seconds // 60
    remaining = seconds % 60
    parts = []
    if minutes > 0:
        parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")
    if remaining > 0:
        parts.append(f"{remaining} second{'s' if remaining != 1 else ''}")
    return " and ".join(parts) if parts else "0 seconds"


def _current_window_strings() -> tuple[str, str, str]:
    """
    Build execution window strings for the current IST time.
    Returns (window_str, start_iso, end_iso) — the current hour to +1 hour.
    This is a simple default for study calls (no configured execution windows).
    """
    tz_ist = pytz.timezone("Asia/Kolkata")
    now_ist = datetime.now(tz_ist)
    start = now_ist.replace(minute=0, second=0, microsecond=0)
    end = start.replace(hour=(start.hour + 1) % 24)

    day_str = start.strftime("%Y-%m-%d")
    start_hm = start.strftime("%H:%M")
    end_hm = end.strftime("%H:%M")
    window_str = f"{day_str} {start_hm} to {day_str} {end_hm} IST"
    start_iso = start.strftime("%Y-%m-%dT%H:%M:%S")
    end_iso = end.strftime("%Y-%m-%dT%H:%M:%S")
    return window_str, start_iso, end_iso


def _extract_questions_from_prompt(prompt: str) -> list[str]:
    """
    Pull bullet-point questions out of the execution prompt's QUESTION_SET section.
    Used to populate the preliminary_questions variable.
    """
    lines = prompt.split("\n")
    questions = []
    for line in lines:
        stripped = line.strip()
        if stripped and (stripped[0].isdigit() or stripped.startswith("-")):
            # Remove leading "1.", "2.", "- ", etc.
            cleaned = stripped.lstrip("0123456789.-) ").strip()
            if cleaned and len(cleaned) > 5:
                questions.append(cleaned)
    return questions[:10]  # cap to avoid huge strings


# ── Main caller ───────────────────────────────────────────────────

async def initiate_call(
    session: AsyncSession,
    queue_item: StudyCallQueue,
    lead: ResearchLead,
    execution: StudyExecution,
) -> dict:
    """
    Initiate a single Bolna voice call for a study queue item.

    Returns:
        {"status": "success", "call_id": str} on success
        {"status": "error", "error": str} on failure
    """
    api_key = settings.BOLNA_API_KEY
    agent_id = execution.bolna_agent_id or settings.BOLNA_AGENT_ID

    if not api_key:
        return {"status": "error", "error": "BOLNA_API_KEY not configured"}
    if not agent_id:
        return {"status": "error", "error": "No Bolna agent_id configured"}

    # 1. Load study + company + user context
    study = await session.get(DesignedStudy, execution.study_id)
    if not study:
        return {"status": "error", "error": f"Study {execution.study_id} not found"}

    company = await session.get(Company, study.company_id)
    user = await session.get(User, study.user_id) if study.user_id else None

    # 2. Normalize phone number
    country_hint = (lead.contact_profile or {}).get("country", "US")
    try:
        phone_e164 = normalize_phone_number(lead.contact_number, default_region=country_hint)
    except ValueError as e:
        logger.error(f"[StudyCaller] Phone normalization failed for lead {lead.id}: {e}")
        return {"status": "error", "error": f"Invalid phone: {e}"}

    # 3. Build variable values

    # Lead's first name
    customer_first_name = (lead.first_name or "there").split()[0] if lead.first_name else "there"

    # Team member first name (from user or fallback)
    team_first_name = "Aditi"
    if user and user.full_name:
        team_first_name = user.full_name.split()[0]
    elif user and hasattr(user, "designation") and user.designation:
        team_first_name = user.designation

    # Brand name
    brand_name = company.brand_name if company else (study.title or "Our Brand")

    # Execution window (current hour, since studies don't configure windows)
    window_str, start_iso, end_iso = _current_window_strings()

    # Questions extracted from the prompt (best-effort)
    questions_list = _extract_questions_from_prompt(queue_item.prompt_text or "")

    # Incentive (not stored on study yet — leave blank)
    incentive_val = ""

    # Resolve all {runtime_var} placeholders in the execution prompt so Bolna
    # receives the final text with lead/company/user context already filled in.
    resolved_prompt = resolve_runtime_vars(
        queue_item.prompt_text or "",
        lead=lead,
        study=study,
        company=company,
        user=user,
    )

    # 4. Build user_data (same shape as existing bolna_caller.py)
    variables = {
        "timezone": "Asia/Kolkata",
        "customer_name": customer_first_name,
        # Aliases used by the Bolna dashboard's Agent Welcome Message template,
        # which references {participant_name} and {agent_name} directly.
        "participant_name": customer_first_name,
        "agent_name": team_first_name,
        "brand_name": brand_name,
        "brand_context": f"Research study: {study.title}" if study.title else "Research Study",
        "customer_context": "Research Participant",
        "team_member_context": "Research Coordinator",
        "team_member_name": team_first_name,
        "preliminary_questions": ", ".join(questions_list) if questions_list else "None",
        "incentive": incentive_val,
        "execution_window": window_str,
        "call_length_planned": _human_readable_duration(execution.call_duration or 600),
        "startTime": start_iso,
        "endTime": end_iso,
        # The full execution prompt for this cohort × interview type,
        # with every {runtime_var} placeholder already resolved to real values.
        # The Bolna dashboard's Agent Prompt should be set to {prompt} so this
        # text becomes the agent's system instructions for the call.
        "prompt": resolved_prompt,
    }

    # For retries, inject previous call context
    if queue_item.execution_count > 1:
        try:
            stmt = (
                select(StudyCallLog)
                .where(StudyCallLog.queue_item_id == queue_item.id)
                .order_by(desc(StudyCallLog.created_at))
                .limit(1)
            )
            result = await session.exec(stmt)
            prev_log = result.first()
            if prev_log:
                prev_transcript = (
                    prev_log.full_transcript or prev_log.transcript_summary or ""
                )
                if prev_transcript:
                    variables["last_call_context"] = prev_transcript
                    logger.info(f"[StudyCaller] Injected last_call_context for lead {lead.id}")
        except Exception as e:
            logger.error(f"[StudyCaller] Failed to fetch previous context: {e}")

    # 5. Resolve webhook URL
    webhook_url = await _resolve_webhook_url()

    # 6. Set webhook_endpoint inside user_data (matches existing caller pattern)
    variables["webhook_endpoint"] = webhook_url

    # 7. Build Bolna payload
    payload = {
        "recipient_phone_number": phone_e164,
        "agent_id": agent_id,
        "user_data": variables,
        "webhook_url": webhook_url,
    }

    logger.info(f"[StudyCaller] Calling {phone_e164} for queue_item {queue_item.id}")
    logger.info(f"[StudyCaller] Payload: {payload}")

    # 8. Call Bolna API
    try:
        async with httpx.AsyncClient() as client:
            url = f"{settings.BOLNA_API_BASE_URL}/call"
            headers = {"Authorization": f"Bearer {api_key}"}
            response = await client.post(url, json=payload, headers=headers, timeout=15.0)

            if response.status_code >= 400:
                error_msg = response.text
                try:
                    err_data = response.json()
                    bolna_msg = err_data.get("message", "")
                    if "verified phone numbers" in bolna_msg:
                        error_msg = "Unverified Phone Number (Telephony Error)"
                    else:
                        error_msg = f"Bolna API Error: {bolna_msg}"
                except Exception:
                    pass
                logger.error(f"[StudyCaller] API error for {phone_e164}: {error_msg}")
                return {"status": "error", "error": error_msg}

            response.raise_for_status()
            data = response.json()

    except Exception as e:
        logger.error(f"[StudyCaller] HTTP error calling {phone_e164}: {e}")
        return {"status": "error", "error": str(e)}

    # 9. Extract call ID from response
    call_id = (
        data.get("execution_id")
        or data.get("run_id")
        or data.get("call_id")
        or data.get("id")
        or f"mock-{uuid4()}"
    )

    # 10. Create StudyCallLog
    call_log = StudyCallLog(
        queue_item_id=queue_item.id,
        execution_id=execution.id,
        lead_id=lead.id,
        bolna_call_id=call_id,
        bolna_agent_id=agent_id,
        call_status="initiated",
        call_duration=0,
        total_cost=0.0,
        currency="USD",
        webhook_payload=data,
    )
    session.add(call_log)
    await session.commit()

    logger.info(f"[StudyCaller] Call initiated: {call_id} → {phone_e164}")
    return {"status": "success", "call_id": call_id}
