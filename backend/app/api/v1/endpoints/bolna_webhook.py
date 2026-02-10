from datetime import datetime, timedelta
from typing import Any, Dict
import logging

import dateutil.parser
from fastapi import APIRouter, Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_session
from app.core.intelligence_utils import enrich_user_intent
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.call_raw_data import CallRawData
from app.models.campaign import Campaign
from app.models.campaign_event import CampaignEvent
from app.models.queue_item import QueueItem
from app.services.intelligence.scheduling_service import scheduling_service
from app.services.user_queue_warmer import UserQueueWarmer
from app.services.lead_closure import LeadClosure

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/webhook/bolna")
async def bolna_webhook(
    payload: Dict[str, Any],
    session: AsyncSession = Depends(get_session),
) -> Any:
    logger.info(f"[BolnaWebhook] Received payload: {payload}")
    
    with open("webhook_live.log", "a") as f:
        f.write(f"[{datetime.now()}] Webhook Received: {payload}\n")
    
    # 1. Extract IDs
    bolna_call_id = payload.get("execution_id") or payload.get("run_id") or payload.get("call_id") or payload.get("id")
    if not bolna_call_id:
        return {"status": "ignored", "reason": "no_call_id"}
        
    # 2. Find Mapping
    statement = select(BolnaExecutionMap).where(BolnaExecutionMap.bolna_call_id == bolna_call_id)
    result = await session.execute(statement)
    execution_map = result.scalars().first()
    
    if not execution_map:
        logger.warning(f"[BolnaWebhook] No execution map found for {bolna_call_id}")
        return {"status": "ignored", "reason": "not_found"}
        
    # 2.5 Save Raw Data (New Requirement)
    try:
        raw_entry = CallRawData(
            campaign_id=execution_map.campaign_id,
            bolna_call_id=bolna_call_id,
            payload=payload
        )
        session.add(raw_entry)
        # We allow this to be committed along with the rest of the updates
    except Exception as e:
        logger.error(f"[BolnaWebhook] Failed to save raw data: {e}")

    # 3. Update Observability Data (BolnaExecutionMap)
    execution_map.last_webhook_payload = payload
    execution_map.call_status = payload.get("status", execution_map.call_status)
    execution_map.transcript_summary = payload.get("transcript_summary") or payload.get("summary") or execution_map.transcript_summary
    
    # Extract duration from telephony_data (Bolna's actual structure) or fallback to top-level
    telephony_data = payload.get("telephony_data", {})
    duration_raw = telephony_data.get("duration") or payload.get("duration")
    execution_map.call_duration = int(float(duration_raw)) if duration_raw else 0 # Handle string float
    
    execution_map.total_cost = float(payload.get("total_cost", 0.0))
    execution_map.currency = payload.get("currency", "USD")
    
    # Transcript & Extraction
    execution_map.transcript = str(payload.get("transcript")) if payload.get("transcript") else None
    execution_map.full_transcript = execution_map.transcript 
    
    # [NEW] Persist Events to CampaignEvent table
    await _persist_campaign_events(payload, execution_map, session)
    
    # [FIX] Handle extracted data which might be in custom_extractions as a string
    extracted_data = payload.get("extracted_data")
    if not extracted_data:
        custom_extractions = payload.get("custom_extractions")
        if custom_extractions:
            if isinstance(custom_extractions, str):
                import json
                try:
                    extracted_data = json.loads(custom_extractions)
                except Exception as e:
                    logger.error(f"[BolnaWebhook] Failed to parse custom_extractions: {e}")
                    extracted_data = {"raw_custom": custom_extractions}
            else:
                extracted_data = custom_extractions
                
    # [NEW] Enrich User Intent with Context
    final_intent = execution_map.extracted_data.get("user_intent", "")
    if final_intent:
        enriched_intent = enrich_user_intent(
            raw_intent=str(final_intent),
            outcome=payload.get("status", "unknown").upper(),
            duration=execution_map.call_duration,
            transcript=execution_map.transcript or ""
        )
        execution_map.extracted_data["user_intent"] = enriched_intent
                
    session.add(execution_map)
    
    # 4. Smart Queue Logic (QueueItem Update)
    q_item = await session.get(QueueItem, execution_map.queue_item_id)
    if not q_item:
        logger.error(f"[BolnaWebhook] Orphaned execution map {execution_map.id}")
        await session.commit()
        return {"status": "processed", "warning": "orphaned_map"}

    # --- TERMINAL STATE CHECK ---
    # We only determine the final outcome and update the QueueItem status 
    # when the call reaches a terminal state. Intermediate states (ringing, speaking)
    # just update the execution map for real-time visibility.
    
    TERMINAL_STATES = ["completed", "failed", "call-disconnected", "voicemail_detected", "no-answer", "busy", "canceled"]
    current_status = (payload.get("status") or "").lower()
    is_terminal = current_status in TERMINAL_STATES or payload.get("answered_by_voice_mail")

    if not is_terminal:
        # Just update the map and broadcast real-time status
        # [NEW] Heartbeat: Keep the item "fresh" to avoid stale cleanup during long calls
        q_item.updated_at = datetime.utcnow()
        session.add(q_item)
        
        await session.commit()
        
        from app.api.v1.endpoints.execution import get_campaign_realtime_status_internal
        # Note: broadcast is handled inside get_campaign_realtime_status_internal
        await get_campaign_realtime_status_internal(q_item.campaign_id, session, trigger_warmer=False)
        
        return {"status": "processed", "state": "intermediate", "detected_status": current_status}

    # --- STATE DETERMINATION LOGIC (Terminal Only) ---
    determined_status = _determine_outcome(
        payload=payload, 
        extracted=execution_map.extracted_data or {}, 
        call_status=execution_map.call_status,
        duration=execution_map.call_duration,
        termination_reason=execution_map.termination_reason
    )

    # [NEW] LEAD CLOSURE & PROMOTION LOGIC (Moved Up for Status Override) ---
    
    # 0. Detect Agreement Status (Shared Logic) - TRANSCRIPT AS SOURCE OF TRUTH
    from app.core.agreement_utils import detect_agreement_status, should_copy_to_queue
    
    # Extract transcript text (source of truth)
    transcript_data = payload.get("transcript", "")
    transcript_str = ""
    
    if isinstance(transcript_data, list):
        # Convert list of turns to text format
        transcript_str = "\n".join([
            f"{turn.get('role', 'unknown')}: {turn.get('content', '')}"
            for turn in transcript_data
        ])
    elif isinstance(transcript_data, str):
        transcript_str = transcript_data
    
    # Enrich intent if not already done
    enriched_intent = execution_map.extracted_data.get("user_intent", "")
    
    # [FIX] Fallback: If no intent extracted by Bolna, use last user message from transcript
    if not enriched_intent and transcript_data:
        user_msgs = []
        if isinstance(transcript_data, list):
             user_msgs = [t.get("content") for t in transcript_data if t.get("role") == "user"]
        
        if user_msgs:
            last_msg = user_msgs[-1]
            logger.info(f"[BolnaWebhook] Fallback: Using last user message as intent: {last_msg}")
            
            # Enrich it on the fly for better agreement detection
            enriched_intent = enrich_user_intent(
                raw_intent=str(last_msg),
                outcome=determined_status,
                duration=execution_map.call_duration,
                transcript=transcript_str
            )

    agreement_status = detect_agreement_status(
        user_intent=str(enriched_intent),
        outcome=determined_status,
        extracted_data=execution_map.extracted_data,
        transcript_text=transcript_str  # PASS TRANSCRIPT AS SOURCE OF TRUTH
    )
    
    # [FIX] CRITICAL OVERRIDE: If Agreement is YES (High/Medium), force status to INTENT_YES
    # This prevents "Disconnected" or "Ambiguous" from masking a positive lead.
    if agreement_status.get("agreed") is True and agreement_status.get("status") == "yes":
        if agreement_status.get("confidence") in ["high", "medium"]:
             logger.info(f"[BolnaWebhook] Overriding status {determined_status} -> INTENT_YES due to Agreement Detection.")
             determined_status = "INTENT_YES"

    logger.info(f"[BolnaWebhook] Lead {q_item.lead_id} Outcome Analysis: {determined_status}")

    # --- SCHEDULING CHECK ---
    # Check if we need to validate scheduling:
    # 1. If status is SCHEDULED_CHECK (explicit scheduling intent detected)
    # 2. If status is INTENT_YES but user also provided time info (e.g., "Yes, call me at 3 AM")
    extracted = execution_map.extracted_data or {}
    has_time_info = bool(
        extracted.get("callback_time") or 
        extracted.get("reschedule_slot") or 
        extracted.get("preferred_time")
    )
    
    if determined_status == "SCHEDULED_CHECK" or (determined_status == "INTENT_YES" and has_time_info):
        callback_time_str = extracted.get("callback_time") or extracted.get("reschedule_slot") or extracted.get("preferred_time")
        
        final_status = "AMBIGUOUS" # Fallback
        
        if callback_time_str:
            try:
                reschedule_dt = dateutil.parser.parse(callback_time_str)
                if reschedule_dt.tzinfo is None:
                    reschedule_dt = reschedule_dt.replace(tzinfo=None)
                    
                if reschedule_dt > datetime.utcnow():
                    campaign = await session.get(Campaign, q_item.campaign_id)
                    windows = campaign.execution_windows if campaign else []
                    is_available = scheduling_service.is_slot_in_windows(reschedule_dt, windows)
                    
                    if is_available:
                        final_status = "SCHEDULED"
                        q_item.scheduled_for = reschedule_dt
                        logger.info(f"[BolnaWebhook] Reschedule Confirmed: {reschedule_dt}")
                    else:
                        final_status = "PENDING_AVAILABILITY"
                        q_item.scheduled_for = reschedule_dt
                        logger.info(f"[BolnaWebhook] Reschedule Requested (Out of Window): {reschedule_dt}")
                else:
                     final_status = "AMBIGUOUS"
                     logger.info("[BolnaWebhook] Ignored past callback time")
            except:
                final_status = "AMBIGUOUS"
        else:
             final_status = "AMBIGUOUS"
             
        determined_status = final_status


    # --- RETRY LOGIC FOR EDGE CASES ---
    # DISCONNECTED is excluded from this list to prevent retries
    RETRIABLE_STATES = ["VOICEMAIL", "NO_ANSWER", "BUSY", "HANGUP", "SILENCE", "LANGUAGE_BARRIER", "FAILED_CONNECT", "AMBIGUOUS", "FAX_ROBOT"]
    
    should_retry = False
    
    if determined_status in RETRIABLE_STATES:
        # [NEW] 10-Second Rule:
        # If the call lasted > 10 seconds, assume legitimate interaction (even if ambiguous)
        # and DO NOT annoy user with a retry.
        if execution_map.call_duration > 10:
             logger.info(f"[BolnaWebhook] Outcome {determined_status} but duration {execution_map.call_duration}s > 10s. Skipping retry to prevent spam.")
             should_retry = False
        elif q_item.execution_count < 2:
            should_retry = True
            logger.info(f"[BolnaWebhook] Edge Case '{determined_status}' detected on Attempt #{q_item.execution_count}. Retrying...")
        else:
            logger.info(f"[BolnaWebhook] Edge Case '{determined_status}' detected. Max retries ({q_item.execution_count}) reached. Finalizing.")

    # Human Outcome Mapping (Moved Up)
    human_outcome_map = {
        "INTENT_YES": "Interested",
        "INTENT_NO": "Not Interested",
        "DNC": "DNC / Stop",
        "WRONG_PERSON": "Wrong Person",
        "SCHEDULED": "Scheduled",
        "PENDING_AVAILABILITY": "Pending Availability",
        "VOICEMAIL": "Voicemail",
        "NO_ANSWER": "No Answer",
        "BUSY": "Busy",
        "HANGUP": "Immediate Hangup",
        "SILENCE": "Silence (Ghost)",
        "LANGUAGE_BARRIER": "Language Barrier",
        "FAILED_CONNECT": "Connection Failed",
        "FAX_ROBOT": "Fax/Robot",
        "AMBIGUOUS": "Ambiguous",
        "DISCONNECTED": "Disconnected"
    }
    
    human_outcome = human_outcome_map.get(determined_status, determined_status.title())

    if should_retry:
        # [FIX] Cooldown for 10 minutes to prevent spamming
        q_item.status = "SCHEDULED"
        q_item.scheduled_for = datetime.utcnow() + timedelta(minutes=10)
        q_item.priority_score = 100 
        q_item.outcome = f"Retry Pending: {human_outcome} (in 10m)"
    else:
        # Finalize State
        q_item.status = determined_status
        q_item.outcome = human_outcome
    
    q_item.updated_at = datetime.utcnow() # [FIX] Finalize timestamp
    session.add(q_item)
    execution_map.call_outcome = determined_status
    session.add(execution_map)
    
    await session.commit()
    
    # AI Queue Closure (if not retrying and not promoted/rescheduled)
    # We close if it's a hard refusal or technical failure that shouldn't be retried
    if not should_retry and not should_copy_to_queue(agreement_status) and determined_status not in ["INTENT_YES", "SCHEDULED", "READY"]:
        # Map determined_status to LeadClosure reason
        closure_map = {
            "DNC": LeadClosure.CLOSURE_DNC,
            "WRONG_PERSON": LeadClosure.CLOSURE_WRONG_PERSON,
            "INTENT_NO": LeadClosure.CLOSURE_NO_INTENT,
            "FAILED_CONNECT": LeadClosure.CLOSURE_FAILED,
        }
        reason = closure_map.get(determined_status, LeadClosure.CLOSURE_NO_INTENT)
        await LeadClosure.close_ai_queue_lead(session, q_item.lead_id, reason, source="BOLNA_WEBHOOK")

    # User Queue Promotion
    # Promote if Bolna says YES OR if our shared agreement logic says YES (High/Medium Confidence)
    is_promotable = (
        determined_status == "INTENT_YES" or 
        should_copy_to_queue(agreement_status)
    )
    
    if is_promotable:
        logger.info(f"[BolnaWebhook] Lead {q_item.id} promoted to User Queue via Webhook. Agreement: {agreement_status}")
        await UserQueueWarmer.promote_to_user_queue(session, q_item.id)
    
    # 6. Update Persistent Call Log
    from app.models.call_log import CallLog
    
    # Try to find existing log
    log_stmt = select(CallLog).where(CallLog.bolna_call_id == bolna_call_id)
    log_result = await session.execute(log_stmt)
    call_log = log_result.scalars().first()
    
    # Formatting outcome for CallLog (Retry is handled naturally via status history, but we can annotate outcome)
    log_outcome = human_outcome
    if should_retry:
         log_outcome = f"Retrying ({human_outcome})"

    if call_log:
        call_log.status = payload.get("status", call_log.status)
        call_log.duration = execution_map.call_duration  # Use the same duration we already extracted
        call_log.total_cost = float(payload.get("total_cost", call_log.total_cost))
        call_log.currency = payload.get("currency", call_log.currency)
        call_log.updated_at = datetime.utcnow()
        call_log.transcript_summary = payload.get("transcript_summary", call_log.transcript_summary)
        call_log.termination_reason = payload.get("termination_reason", call_log.termination_reason)
        call_log.webhook_payload = payload
        call_log.outcome = log_outcome
            
        # Extract recording_url from telephony_data or fallback to top-level
        recording_url = telephony_data.get("recording_url") or payload.get("recording_url")
        if recording_url:
            call_log.recording_url = recording_url
            
        session.add(call_log)
        
    else:
        call_log = CallLog(
            campaign_id=execution_map.campaign_id,
            lead_id=q_item.lead_id if q_item else execution_map.queue_item_id,
            bolna_call_id=bolna_call_id,
            bolna_agent_id=getattr(execution_map, "bolna_agent_id", "unknown"),
            status=payload.get("status", "unknown"),
            duration=execution_map.call_duration,  # Use the same duration we already extracted
            total_cost=float(payload.get("total_cost", 0.0)),
            webhook_payload=payload,
            outcome=log_outcome
        )
        session.add(call_log)
    
    await session.commit()

    # 7. Broadcast Real-time Update

    # 7. Broadcast Real-time Update
    # 7. Broadcast Real-time Update
    from app.api.v1.endpoints.execution import get_campaign_realtime_status_internal
    
    try:
        # Trigger warmer on terminal state to replenish queue if needed
        await get_campaign_realtime_status_internal(q_item.campaign_id, session, trigger_warmer=True)
        logger.info(f"[BolnaWebhook] Broadcasted terminal update for campaign {q_item.campaign_id}")
    except Exception as e:
        logger.error(f"[BolnaWebhook] Failed to broadcast update: {e}")

    return {"status": "processed", "detected_state": determined_status if not should_retry else "RETRYING"}


def _determine_outcome(payload: dict, extracted: dict, call_status: str, duration: int, termination_reason: str) -> str:
    """
    Categorizes the call result into a definitive System State.
    """
    call_status = (call_status or "").lower()
    termination_reason = (termination_reason or "").lower()
    
    # 1. Technical Signals (High Confidence Machines/Network)
    if payload.get("answered_by_voice_mail") or "voicemail" in termination_reason or "voice mail" in termination_reason:
        return "VOICEMAIL"

    if call_status == "no-answer":
        return "NO_ANSWER"
        
    if call_status == "busy":
        return "BUSY"
        
    if call_status == "failed":
        return "FAILED_CONNECT"

    if "machine" in termination_reason or "fax" in termination_reason:
        return "FAX_ROBOT"

    # 2. Hard Refusals / DNC (Priority over Yes/No)
    dnc_flag = extracted.get("dnc") or extracted.get("stop_calling")
    if dnc_flag:
        return "DNC"

    transcript_text = (payload.get("transcript") or "").lower()
    dnc_keywords = ["stop calling", "remove me", "don't call", "do not call", "wrong number", "harassment", "take me off"]
    if any(keyword in transcript_text for keyword in dnc_keywords):
        return "DNC"

    # 3. Intent Extraction
    if extracted.get("interested"):
        return "INTENT_YES"
        
    if extracted.get("wrong_person"):
        return "WRONG_PERSON"
        
    if extracted.get("language_barrier"):
        return "LANGUAGE_BARRIER"

    if extracted.get("not_interested"):
        return "INTENT_NO"

    # Scheduling check (Requires validation in main loop)
    if extracted.get("callback_time") or extracted.get("reschedule_slot") or extracted.get("preferred_time"):
        return "SCHEDULED_CHECK"

        
    # 4. Analyze Behavior (Duration & Transcript)
    
    # Hangup Analysis
    if call_status == "completed":
        if duration < 5:
            # Immediate Hangup
            return "HANGUP"
            
        # Silence / Ghost Analysis
        transcript = payload.get("transcript")
        is_silent = False
        if not transcript:
            is_silent = True
        elif isinstance(transcript, str) and not transcript.strip():
            is_silent = True
        elif isinstance(transcript, list) and len(transcript) == 0:
            is_silent = True
            
        if is_silent:
            return "SILENCE"
            
        # If duration > 5s and transcript exists, but no intent found above -> Ambiguous
        
        # [NEW] If call was long (e.g. > 10s) but no intent found, mark as DISCONNECTED instead of AMBIGUOUS
        # This implies we had a conversation but the line might have dropped or we just didn't get a result.
        # We use DISCONNECTED to prevent retries (as per user rule).
        if duration > 10:
            return "DISCONNECTED"
            
        return "AMBIGUOUS"
        
    # [NEW] Catch-all for failed/error states with significant duration
    if call_status in ["failed", "call-disconnected"] and duration > 10:
        return "DISCONNECTED"

    return "AMBIGUOUS"

async def _persist_campaign_events(payload: dict, exec_map: BolnaExecutionMap, session: AsyncSession):
    """
    Parses transcript and metadata from payload and stores new events in CampaignEvent table.
    Ensures idempotency using turn-based IDs and provides accurate timestamps.
    """
    transcript_data = payload.get('transcript')
    if not transcript_data:
        return

    # Fetch QueueItem to get real lead_id
    q_item = await session.get(QueueItem, exec_map.queue_item_id)
    lead_id = q_item.lead_id if q_item else None

    # [FIX] Use stable ID-based indexing instead of non-deterministic hash()
    NAMES = ["Alex", "Sarah", "Rohan", "Maya", "Jordan", "Priya", "Vikram", "Tara", "Leo", "Elena", "Marcus", "Skylar"]
    stable_id = str(lead_id) if lead_id else str(exec_map.queue_item_id)
    stable_id_int = int(stable_id.replace('-', ''), 16)
    name_idx = (stable_id_int % len(NAMES))
    agent_name = NAMES[name_idx]

    events_to_add = []
    base_time = datetime.utcnow()
    
    import random

    # Neural Phrasing Banks
    AGENT_THOUGHTS = [
        "Analyzing contextual cues...",
        "Formulating optimal response...",
        "Accessing knowledge base...",
        "Adjusting tone parameters...",
        "Synchronizing with script...",
        "Calibrating empathy engine...",
        "Processing conversation flow...",
        "Retrieving objection handlers..."
    ]
    
    USER_THOUGHTS = [
        "Processing user input...",
        "Analyzing sentiment polarity...",
        "Detecting intent signals...",
        "Logging interaction metrics...",
        "Parsing verbal feedback...",
        "Updating lead profile...",
        "Evaluating engagement level..."
    ]

    # 1. Process Structured Transcript (List of turns)
    # [FIX] Handle string transcripts from Bolna (e.g. "assistant: Hello\nuser: Hi")
    final_transcript = []
    if isinstance(transcript_data, str):
        lines = transcript_data.split('\n')
        for line in lines:
            if not line.strip(): continue
            parts = line.split(':', 1)
            if len(parts) == 2:
                role = parts[0].strip().lower()
                content = parts[1].strip()
                final_transcript.append({"role": role, "content": content})
            else:
                # Fallback for unformatted lines
                final_transcript.append({"role": "system", "content": line.strip()})
    elif isinstance(transcript_data, list):
        final_transcript = transcript_data

    # [FIX] Ensure we have at least ONE event if the call is active, to prevent empty "Neural Watchdog"
    # If transcript is empty but we have a status, generate a synthetic "System" event
    if not final_transcript and exec_map.call_status in ["initiated", "ringing", "connected"]:
         # Only do this if we haven't generated events recently? 
         # Simpler: Just add a "Monitoring" thought if empty.
         # Synthetic event generation for immediate UI feedback
         initial_msg = "Initializing secure connection..."
         if exec_map.call_status == "initiated":
             initial_msg = "Dialing lead..."
         elif exec_map.call_status == "ringing":
             initial_msg = "Remote line ringing..."
         elif exec_map.call_status == "connected":
             initial_msg = "Connection established. Listening..."
             
         evt_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{exec_map.id}-init")
         events_to_add.append(CampaignEvent(
            id=evt_id,
            campaign_id=exec_map.campaign_id,
            lead_id=lead_id,
            event_type="SYSTEM",
            message=initial_msg,
            agent_name="SYSTEM",
            status=exec_map.call_status,
            created_at=base_time,
            data={"call_id": exec_map.bolna_call_id}
         )) 

    for i, turn in enumerate(final_transcript):
        role = turn.get('role', 'system')
        content = (turn.get('content', '') or turn.get('message', '')).strip()
        if not content: continue

        # Generate deterministic UUID for turn
        event_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{exec_map.id}-turn-{i}")
        
        evt_type = "AGENT_ACTION" if role in ['agent', 'assistant'] else "USER_REPLY"
        
        # Message formatting
        if evt_type == "AGENT_ACTION":
            c = content.lower()
            if any(x in c for x in ["hello", "hi", "hey"]):
                message = f"{agent_name} is greeting the lead."
            else:
                clean_content = content[:120] + "..." if len(content) > 120 else content
                message = f"{agent_name} is saying: \"{clean_content}\""
        else:
            clean_content = content[:120] + "..." if len(content) > 120 else content
            message = f"Lead replied: \"{clean_content}\""

        # Accurate Time with offset for turns (1s per turn for visual spacing)
        turn_time = base_time + timedelta(seconds=i)

        events_to_add.append(CampaignEvent(
            id=event_id,
            campaign_id=exec_map.campaign_id,
            lead_id=lead_id,
            event_type=evt_type,
            message=message,
            agent_name=agent_name,
            status=exec_map.call_status,
            created_at=turn_time,
            data={"call_id": exec_map.bolna_call_id}
        ))

        # Add Neural Thought (Enhanced Heuristic)
        thought_msg = None
        c_content = content.lower()
        
        if role == 'user':
            # Specific Logic
            if any(x in c_content for x in ["no", "busy", "not interested", "stop", "wrong"]):
                thought_msg = "Resistance detected. Analyzing objection pattern..."
            elif any(x in c_content for x in ["yes", "sure", "okay", "yeah", "interested"]):
                thought_msg = "Positive signal received. Advancing mission objective."
            elif any(x in c_content for x in ["call back", "later", "time", "schedule", "busy now"]):
                thought_msg = "Scheduling intent detected. Checking calendar availability..."
            elif any(x in c_content for x in ["who", "what", "why"]):
                thought_msg = "Inquiry detected. Preparing verification credentials..."
            elif "forwarded" in c_content or "voicemail" in c_content:
                thought_msg = "Voicemail system detected. Disengaging..."
            else:
                # Fallback Random
                thought_msg = random.choice(USER_THOUGHTS)
        
        elif evt_type == "AGENT_ACTION":
            # Specific Logic
            if any(x in c_content for x in ["hello", "hi", "hey"]):
                thought_msg = "Initiating rapport building sequence..."
            elif "?" in content:
                thought_msg = "Querying user for critical information..."
            else:
                # Fallback Random
                thought_msg = random.choice(AGENT_THOUGHTS)
        
        if thought_msg:
            # Thought happens slightly after the turn
            thought_time = turn_time + timedelta(milliseconds=500)
            thought_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{exec_map.id}-thought-{i}")
            events_to_add.append(CampaignEvent(
                id=thought_id,
                campaign_id=exec_map.campaign_id,
                lead_id=lead_id,
                event_type="THOUGHT",
                message=thought_msg,
                agent_name=agent_name,
                status=exec_map.call_status,
                created_at=thought_time,
                data={"call_id": exec_map.bolna_call_id}
            ))

    # Bulk add with conflict resolution
    for event in events_to_add:
        try:
            existing = await session.get(CampaignEvent, event.id)
            if not existing:
                session.add(event)
        except:
            pass
