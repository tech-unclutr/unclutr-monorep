"""
Study-call webhook — receives Bolna call lifecycle events for calls placed
through the agent-execution flow and updates the matching `StudyCallLog` row.

Sibling to `bolna_webhook.py`, which handles campaign calls. This one only
touches `study_call_logs` and never touches CallLog / BolnaExecutionMap /
QueueItem / CampaignEvent. Bolna fires this URL when the agent's dashboard
webhook is pointed at /api/v1/webhook/study-bolna (or when our outbound
trigger payload sets `webhook_url` to it).
"""

import json
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, Depends
from loguru import logger
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_session
from app.models.study_designer import StudyCallLog


router = APIRouter()


@router.post("/webhook/study-bolna")
async def study_bolna_webhook(
    payload: Dict[str, Any],
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """Update the StudyCallLog row matching the inbound bolna_call_id."""
    logger.info(f"[StudyBolnaWebhook] Received payload keys: {list(payload.keys())}")

    bolna_call_id = (
        payload.get("execution_id")
        or payload.get("run_id")
        or payload.get("call_id")
        or payload.get("id")
    )
    if not bolna_call_id:
        return {"status": "ignored", "reason": "no_call_id"}

    stmt = select(StudyCallLog).where(StudyCallLog.bolna_call_id == str(bolna_call_id))
    result = await session.execute(stmt)
    log_row = result.scalars().first()

    if not log_row:
        logger.warning(
            f"[StudyBolnaWebhook] No StudyCallLog found for bolna_call_id={bolna_call_id}"
        )
        return {"status": "ignored", "reason": "not_found"}

    telephony = payload.get("telephony_data") or {}

    duration_raw = telephony.get("duration") or payload.get("duration")
    try:
        duration = int(float(duration_raw)) if duration_raw is not None else 0
    except (TypeError, ValueError):
        duration = 0

    transcript = payload.get("transcript")
    if isinstance(transcript, (list, dict)):
        full_transcript = json.dumps(transcript, ensure_ascii=False)
    elif transcript is None:
        full_transcript = None
    else:
        full_transcript = str(transcript)

    extracted = payload.get("extracted_data")
    if not extracted:
        custom = payload.get("custom_extractions")
        if isinstance(custom, str):
            try:
                extracted = json.loads(custom)
            except Exception:
                extracted = {"raw_custom": custom}
        elif isinstance(custom, dict):
            extracted = custom

    log_row.call_status = payload.get("status") or log_row.call_status
    log_row.call_outcome = payload.get("status") or log_row.call_outcome
    log_row.call_duration = duration if duration else log_row.call_duration
    log_row.total_cost = float(payload.get("total_cost", log_row.total_cost or 0.0))
    log_row.currency = payload.get("currency", log_row.currency)
    log_row.transcript_summary = (
        payload.get("transcript_summary")
        or payload.get("summary")
        or log_row.transcript_summary
    )
    log_row.full_transcript = full_transcript or log_row.full_transcript
    if extracted is not None:
        log_row.extracted_data = extracted
    log_row.termination_reason = (
        payload.get("error_message")
        or payload.get("termination_reason")
        or log_row.termination_reason
    )
    log_row.recording_url = (
        telephony.get("recording_url")
        or payload.get("recording_url")
        or log_row.recording_url
    )
    log_row.webhook_payload = payload
    log_row.updated_at = datetime.utcnow()

    session.add(log_row)
    await session.commit()

    logger.info(
        f"[StudyBolnaWebhook] Updated StudyCallLog bolna_call_id={bolna_call_id} "
        f"status={log_row.call_status} duration={log_row.call_duration} "
        f"error_message={payload.get('error_message')!r} "
        f"smart_status={payload.get('smart_status')!r}"
    )

    return {
        "status": "processed",
        "bolna_call_id": str(bolna_call_id),
        "call_status": log_row.call_status,
    }
