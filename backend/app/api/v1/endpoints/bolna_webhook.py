from typing import Any, Dict, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
import dateutil.parser

from app.api.deps import get_session
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.queue_item import QueueItem
from app.services.queue_warmer import QueueWarmer
from app.services.intelligence.scheduling_service import scheduling_service
from app.models.campaign import Campaign

router = APIRouter()

@router.post("/webhook/bolna")
async def bolna_webhook(
    payload: Dict[str, Any],
    session: AsyncSession = Depends(get_session),
) -> Any:
    """
    Receives events from Bolna Voice AI.
    Parses cost, transcript, and extracted data to drive the campaign state machine.
    """
    print(f"[BolnaWebhook] Received payload: {payload}")
    
    # 1. Extract IDs
    bolna_call_id = payload.get("execution_id") or payload.get("run_id") or payload.get("call_id") or payload.get("id")
    if not bolna_call_id:
        return {"status": "ignored", "reason": "no_call_id"}
        
    # 2. Find Mapping
    statement = select(BolnaExecutionMap).where(BolnaExecutionMap.bolna_call_id == bolna_call_id)
    result = await session.execute(statement)
    execution_map = result.scalars().first()
    
    if not execution_map:
        print(f"[BolnaWebhook] No execution map found for {bolna_call_id}")
        return {"status": "ignored", "reason": "not_found"}
        
    # 3. Update Observability Data (BolnaExecutionMap)
    execution_map.last_webhook_payload = payload
    execution_map.call_status = payload.get("status", execution_map.call_status)
    execution_map.call_duration = int(payload.get("duration", 0))
    execution_map.total_cost = float(payload.get("total_cost", 0.0))
    execution_map.currency = payload.get("currency", "USD")
    
    # Transcript & Extraction
    execution_map.transcript = payload.get("transcript")
    execution_map.full_transcript = payload.get("transcript") # Legacy field compatibility
    execution_map.extracted_data = payload.get("extracted_data", {})
    execution_map.telephony_provider = payload.get("telephony_provider")
    execution_map.termination_reason = payload.get("termination_reason")
    
    session.add(execution_map)
    
    # 4. Smart Queue Logic (QueueItem Update)
    q_item = await session.get(QueueItem, execution_map.queue_item_id)
    if not q_item:
         print(f"[BolnaWebhook] Orphaned execution map {execution_map.id}")
         await session.commit()
         return {"status": "processed", "warning": "orphaned_map"}

    extracted = execution_map.extracted_data or {}
    print(f"[BolnaWebhook] Extracted Data for Lead {q_item.lead_id}: {extracted}")

    # A. Check for Callback / Reschedule
    # Keys might vary based on Extraction Prompt, checking common variations
    callback_time_str = extracted.get("callback_time") or extracted.get("reschedule_slot") or extracted.get("preferred_time")
    
    if callback_time_str:
        try:
            # Parse ISO string or similar date format
            # Aditi prompt uses "reschedule_slot" or "callback_time"
            reschedule_dt = dateutil.parser.parse(callback_time_str)
            
            # Ensure it's in the future
            if reschedule_dt.tzinfo is None:
                reschedule_dt = reschedule_dt.replace(tzinfo=None) # Keep it naive for now as per app pattern
                
            if reschedule_dt > datetime.utcnow():
                # [NEW] Check against Execution Windows
                campaign = await session.get(Campaign, q_item.campaign_id)
                windows = campaign.execution_windows if campaign else []
                
                is_available = scheduling_service.is_slot_in_windows(reschedule_dt, windows)
                
                if is_available:
                    q_item.status = "SCHEDULED"
                    print(f"[BolnaWebhook] Rescheduling Lead {q_item.lead_id} for {reschedule_dt} (In Window)")
                else:
                    q_item.status = "PENDING_AVAILABILITY"
                    print(f"[BolnaWebhook] Lead {q_item.lead_id} requested {reschedule_dt} (OUTSIDE Window) -> PENDING_AVAILABILITY")
                
                q_item.scheduled_for = reschedule_dt
            else:
                print(f"[BolnaWebhook] Ignored past callback time: {reschedule_dt}")
                
        except Exception as e:
            print(f"[BolnaWebhook] Failed to parse callback time '{callback_time_str}': {e}")
            # Fallthrough: treat as normal completed call

    # B. Check for Intent
    # Only if NOT rescheduled above (Scheduled takes precedence)
    if q_item.status != "SCHEDULED":
        # Check for explicit 'interested' flag
        user_interested = extracted.get("interested", False)
        if isinstance(user_interested, str):
            user_interested = user_interested.lower() in ["true", "yes"]
            
        if user_interested:
            q_item.status = "INTENT_YES" 
            print(f"[BolnaWebhook] Lead {q_item.lead_id} -> INTENT_YES (Interested)")
            
        elif execution_map.call_status == "completed":
            # If call completed but not interested and not rescheduled
            is_not_interested = extracted.get("not_interested", False)
            if isinstance(is_not_interested, str):
                is_not_interested = is_not_interested.lower() in ["true", "yes"]

            if is_not_interested:
                 q_item.status = "INTENT_NO"
                 print(f"[BolnaWebhook] Lead {q_item.lead_id} -> INTENT_NO")
            else:
                 q_item.status = "INTENT_NO_ANSWER"
                 print(f"[BolnaWebhook] Lead {q_item.lead_id} -> INTENT_NO_ANSWER (Completed, no clear intent)")
        
        elif execution_map.call_status == "failed":
            q_item.status = "FAILED"
            print(f"[BolnaWebhook] Lead {q_item.lead_id} -> FAILED")

    session.add(q_item)
    await session.commit()
    
    # 5. Trigger Replenishment
    if q_item.status != "DIALING_INTENT":
         await QueueWarmer.check_and_replenish(q_item.campaign_id, session)

    # 6. [NEW] Update Persistent Call Log
    from app.models.call_log import CallLog
    
    # Try to find existing log
    log_stmt = select(CallLog).where(CallLog.bolna_call_id == bolna_call_id)
    log_result = await session.execute(log_stmt)
    call_log = log_result.scalars().first()
    
    # Determine Outcome based on logic above
    determined_outcome = None
    if q_item.status == "INTENT_YES":
        determined_outcome = "Interested"
    elif q_item.status == "INTENT_NO":
        determined_outcome = "Not Interested"
    elif q_item.status == "SCHEDULED":
        determined_outcome = "Scheduled"
    elif q_item.status == "INTENT_NO_ANSWER":
        determined_outcome = "No Answer"
    elif q_item.status == "FAILED":
        determined_outcome = "Failed"
    
    if call_log:
        # Update existing
        call_log.status = payload.get("status", call_log.status)
        call_log.duration = int(payload.get("duration", call_log.duration))
        call_log.total_cost = float(payload.get("total_cost", call_log.total_cost))
        call_log.currency = payload.get("currency", call_log.currency)
        call_log.updated_at = datetime.utcnow()
        call_log.transcript_summary = payload.get("transcript_summary", call_log.transcript_summary) # If available
        call_log.termination_reason = payload.get("termination_reason", call_log.termination_reason)
        call_log.webhook_payload = payload
        
        # [NEW] Update Outcome
        if determined_outcome:
            call_log.outcome = determined_outcome
        
        # Specific breakdown if available
        if "recording_url" in payload:
            call_log.recording_url = payload["recording_url"]
            
        session.add(call_log)
        print(f"[BolnaWebhook] Updated CallLog {call_log.id} status to {call_log.status}, outcome: {call_log.outcome}")
        
    else:
        # Create new (Recovery for edge cases or missed initiation)
        print(f"[BolnaWebhook] CallLog not found for {bolna_call_id}. Creating new.")
        # Need campaign_id and lead_id from execution_map (if available) or manual lookup
        # Since we found execution_map above, we can use its IDs
        
        call_log = CallLog(
            campaign_id=execution_map.campaign_id,
            lead_id=q_item.lead_id if q_item else execution_map.queue_item_id,
            bolna_call_id=bolna_call_id,
            bolna_agent_id=execution_map.bolna_agent_id,
            status=payload.get("status", "unknown"),
            duration=int(payload.get("duration", 0)),
            total_cost=float(payload.get("total_cost", 0.0)),
            webhook_payload=payload,
            outcome=determined_outcome
        )
        
        session.add(call_log)
    
    # [FIX] Commit the CallLog updates BEFORE broadcasting
    # This ensures that when the frontend receives the 'status_update' and refetches logs, it gets the data we just saved.
    await session.commit()

    # 7. Broadcast Real-time Update immediately
    # This prevents the 10s wait on frontend
    from app.api.v1.endpoints.execution import get_campaign_realtime_status_internal
    from app.services.websocket_manager import manager as ws_manager
    
    # We broadcast for the campaign
    try:
        status_data = await get_campaign_realtime_status_internal(q_item.campaign_id, session, trigger_warmer=False)
        await ws_manager.broadcast_status_update(str(q_item.campaign_id), status_data)
        print(f"[BolnaWebhook] Broadcasted update for campaign {q_item.campaign_id}")
    except Exception as e:
        print(f"[BolnaWebhook] Failed to broadcast update: {e}")

    return {"status": "processed"}


