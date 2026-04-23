"""
Study Execution — Bolna Webhook Endpoint

Receives callbacks from Bolna for study voice calls.
Updates StudyCallLog with call data. The engine's tick() reads
these updates to determine outcomes and drive the state machine.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_session
from app.models.study_designer.study_call_log import StudyCallLog
from app.models.study_designer.study_call_queue import StudyCallQueue
from app.services.study_execution.outcomes import is_terminal_state

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/webhook/study-bolna")
async def study_bolna_webhook(
    payload: Dict[str, Any],
    session: AsyncSession = Depends(get_session),
) -> Any:
    """
    Process a Bolna callback for a study voice call.

    Non-terminal webhooks (ringing, connected, etc.) update the call log
    and touch the queue item's updated_at as a heartbeat.

    Terminal webhooks (completed, failed, etc.) update the call log with
    full transcript/extraction data. The engine's tick() then reads these
    to determine outcomes and update queue item status.
    """
    logger.info(f"[StudyWebhook] Received payload: {payload}")

    # 1. Extract call ID
    bolna_call_id = (
        payload.get("execution_id")
        or payload.get("run_id")
        or payload.get("call_id")
        or payload.get("id")
    )
    if not bolna_call_id:
        return {"status": "ignored", "reason": "no_call_id"}

    # 2. Find StudyCallLog (with retry for race condition with caller)
    call_log = None
    for attempt in range(3):
        stmt = select(StudyCallLog).where(StudyCallLog.bolna_call_id == bolna_call_id)
        result = await session.execute(stmt)
        call_log = result.scalars().first()
        if call_log:
            break
        if attempt < 2:
            logger.info(
                f"[StudyWebhook] Log not found for {bolna_call_id}, "
                f"retrying in 1s (attempt {attempt + 1}/3)"
            )
            await asyncio.sleep(1)

    if not call_log:
        logger.warning(f"[StudyWebhook] No call log found for {bolna_call_id}")
        return {"status": "ignored", "reason": "not_found"}

    # 3. Update call log with webhook data
    call_log.webhook_payload = payload
    call_log.call_status = payload.get("status", call_log.call_status)
    call_log.transcript_summary = (
        payload.get("transcript_summary")
        or payload.get("summary")
        or call_log.transcript_summary
    )

    # Duration from telephony_data or top-level
    telephony_data = payload.get("telephony_data", {})
    duration_raw = telephony_data.get("duration") or payload.get("duration")
    if duration_raw:
        call_log.call_duration = int(float(duration_raw))

    call_log.total_cost = float(payload.get("total_cost", call_log.total_cost))
    call_log.currency = payload.get("currency", call_log.currency)
    call_log.termination_reason = payload.get(
        "termination_reason", call_log.termination_reason
    )

    # Recording URL
    recording_url = telephony_data.get("recording_url") or payload.get("recording_url")
    if recording_url:
        call_log.recording_url = recording_url

    # Transcript
    transcript_raw = payload.get("transcript")
    if transcript_raw:
        if isinstance(transcript_raw, (list, dict)):
            call_log.full_transcript = json.dumps(transcript_raw)
        else:
            call_log.full_transcript = str(transcript_raw)

    # Extracted data
    extracted = payload.get("extracted_data")
    if not extracted:
        custom = payload.get("custom_extractions")
        if custom:
            if isinstance(custom, str):
                try:
                    extracted = json.loads(custom)
                except Exception:
                    extracted = {"raw_custom": custom}
            else:
                extracted = custom
    if extracted:
        call_log.extracted_data = extracted

    call_log.updated_at = datetime.utcnow()
    session.add(call_log)

    # 4. Heartbeat the queue item (prevents stale cleanup during long calls)
    queue_item = await session.get(StudyCallQueue, call_log.queue_item_id)
    if queue_item:
        queue_item.updated_at = datetime.utcnow()
        session.add(queue_item)

    await session.commit()

    # 5. Determine if terminal
    current_status = (payload.get("status") or "").lower()
    is_terminal = is_terminal_state(current_status, payload)

    if not is_terminal:
        return {
            "status": "processed",
            "state": "intermediate",
            "detected_status": current_status,
        }

    # Terminal state — the engine's tick() will pick this up on the next poll
    # and run determine_call_outcome() to set the final queue item status.
    logger.info(
        f"[StudyWebhook] Terminal state for {bolna_call_id}: "
        f"{current_status}, duration={call_log.call_duration}s"
    )

    return {
        "status": "processed",
        "state": "terminal",
        "detected_status": current_status,
    }
