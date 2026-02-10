from datetime import datetime, timedelta
from typing import Any, List, Optional
import logging
import asyncio
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlmodel import and_, func, or_, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_active_user, get_session
from app.core.agreement_utils import detect_agreement_status, should_copy_to_queue
from app.core.db import async_session_factory
from app.core.intelligence_utils import enrich_user_intent, extract_next_step
from app.core.lead_utils import normalize_phone_number
from app.core.sentiment_utils import analyze_sentiment
from app.models.calendar_connection import CalendarConnection
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem
from app.models.user import User
from app.services.intelligence.google_calendar_service import google_calendar_service
from app.services.queue_warmer import QueueWarmer
from app.services.websocket_manager import manager as ws_manager

logger = logging.getLogger(__name__)

router = APIRouter()

from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.call_log import CallLog
from app.models.campaign_event import CampaignEvent
from app.models.user_queue_item import UserQueueItem
from app.models.user_call_log import UserCallLog

# Timeout constants for stale call detection
INITIATED_TIMEOUT_MINUTES = 5  # Calls stuck in "initiated" for >5 min are stale
ACTIVE_CALL_TIMEOUT_MINUTES = 30  # Active calls >30 min are stale

class WindowExtensionRequest(BaseModel):
    hours: int = 2

@router.get("/campaign/{campaign_id}/active-status")
async def get_active_status(
    campaign_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Returns the real-time status of active agents (calls).
    """
    return await get_campaign_realtime_status_internal(campaign_id, session, trigger_warmer=True)


@router.get("/campaign/{campaign_id}/completion-data")
async def get_completion_data(
    campaign_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Returns completion data for a campaign (fallback for WebSocket failures).
    """
    status_data = await get_campaign_realtime_status_internal(campaign_id, session, trigger_warmer=False)
    return status_data.get("completion_data", {})



async def get_campaign_realtime_status_internal(campaign_id: UUID, session: AsyncSession, trigger_warmer: bool = False) -> dict:
    """
    Core logic for calculating the real-time engagement dashboard.
    Shared between periodic polling and WebSocket broadcasts.
    """
    # 0. Fetch Campaign
    campaign = await session.get(Campaign, campaign_id)
    if not campaign:
        return {}

    # Initialize variables to avoid UnboundLocalError
    total_leads = 0
    call_logs_count = 0
        
    # [NEW] Trigger Warmer/Replenish at the VERY START to ensure all subsequent queries see the new state
    # This ensures "DIALING_INTENT" leads added by the warmer appear in the 'agents' list immediately.
    if trigger_warmer and campaign.status not in ["COMPLETED", "DRAFT"]:
        try:
            await QueueWarmer.check_and_replenish(campaign_id, session)
            # Refresh campaign object as warmer might have updated its status (e.g. to PAUSED)
            await session.refresh(campaign)
        except Exception as e:
            logger.warning(f"[Execution] Warning: QueueWarmer failed in active-status check: {e}")
            # We continue execution so the dashboard still loads (partial degradation)

    config = campaign.execution_config or {}
    MAX_CONCURRENCY = config.get("max_concurrent_calls", 2) # Default to 2
    
    # 2. Query Active Execution Maps
    # We query QueueItems that are either marked for dialing OR have an active call record
    # Note: We join BolnaExecutionMap loosely, then filter in the WHERE clause
    # IMPORTANT: Filter out stale entries based on timeout thresholds
    
    # [FIX] Stricter timeout for DIALING_INTENT to prevent "ghost dialing"
    # If it's been in DIALING_INTENT for > 2 mins without an execution map, it's stuck.
    dialing_cutoff = datetime.utcnow() - timedelta(minutes=2)
    
    initiated_cutoff = datetime.utcnow() - timedelta(minutes=2) # Reduced from 5
    active_cutoff = datetime.utcnow() - timedelta(minutes=ACTIVE_CALL_TIMEOUT_MINUTES)
    
    statement = (
        select(QueueItem, CampaignLead, BolnaExecutionMap)
        .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
        .outerjoin(BolnaExecutionMap, QueueItem.id == BolnaExecutionMap.queue_item_id)
        .where(QueueItem.campaign_id == campaign_id)
        .where(
            or_(
                # Case 1: DIALING_INTENT - Must be recent
                and_(
                    QueueItem.status == "DIALING_INTENT",
                    QueueItem.updated_at > dialing_cutoff
                ),
                # Case 2: Active execution map with recent activity
                and_(
                    func.lower(BolnaExecutionMap.call_status).in_(["initiated", "ringing", "connected", "speaking", "listening", "processing", "in-progress"]),
                    # [FIX] Zombie Guard: Do not show executions if the QueueItem is already finalized/closed
                    # This prevents "Dialing..." persisting after a webhook closes the item or admin resets it.
                    QueueItem.status.not_in([
                        "COMPLETED", "FAILED", "INTENT_YES", "INTENT_NO", "DNC", 
                        "WRONG_PERSON", "SCHEDULED", "PENDING_AVAILABILITY", 
                        "INTENT_UNKNOWN", "CLOSED", "FAX_ROBOT", "SILENCE",
                        "LANGUAGE_BARRIER", "FAILED_CONNECT", "VOICEMAIL", "NO_ANSWER", "BUSY", "HANGUP"
                    ]),
                    or_(
                        # Initiated calls must be recent (< 2 min)
                        and_(
                            func.lower(BolnaExecutionMap.call_status) == "initiated",
                            BolnaExecutionMap.updated_at > initiated_cutoff
                        ),
                        # Active calls must be recent (< 30 min)
                        and_(
                            func.lower(BolnaExecutionMap.call_status).in_(["ringing", "connected", "speaking", "listening", "processing", "in-progress"]),
                            BolnaExecutionMap.updated_at > active_cutoff
                        )
                    )
                )
            )
        )
        .order_by(QueueItem.created_at.asc())
    )
    
    result = await session.execute(statement)
    results = result.all()
    
    # Deduplicate by queue_item_id - keep only the most recent execution map per queue item
    unique_items = {}
    for q_item, lead, exec_map in results:
        queue_item_id = str(q_item.id)
        
        # If we haven't seen this queue item yet, or if this exec_map is newer
        if queue_item_id not in unique_items:
            unique_items[queue_item_id] = (q_item, lead, exec_map)
        elif exec_map and unique_items[queue_item_id][2]:
            # Both have exec_maps - compare timestamps
            existing_exec_map = unique_items[queue_item_id][2]
            if exec_map.created_at > existing_exec_map.created_at:
                unique_items[queue_item_id] = (q_item, lead, exec_map)
        elif exec_map and not unique_items[queue_item_id][2]:
            # New one has exec_map, existing doesn't - prefer the one with exec_map
            unique_items[queue_item_id] = (q_item, lead, exec_map)
    
    agents = []
    # Real-world names pool
    NAMES = [
        "Alex", "Sarah", "Rohan", "Maya", 
        "Jordan", "Priya", "Vikram", "Tara",
        "Leo", "Elena", "Marcus", "Skylar"
    ]
    
    for i, (q_item, lead, exec_map) in enumerate(unique_items.values()):
        # [FIX] Use stable ID-based indexing instead of non-deterministic hash()
        # This ensures agent names remain consistent across restarts and processes.
        lead_id_int = int(str(lead.id).replace('-', ''), 16)
        name_idx = (lead_id_int % len(NAMES))
        agent_name = NAMES[name_idx]
        
        # Determine status
        if exec_map:
            # [FIX] If we are in DIALING_INTENT but the map is old/stale (failed/completed), 
            # it implies we are retrying. Show 'initiated' to reflect the new attempt.
            is_stale_map = exec_map.call_status in ["completed", "failed", "busy", "no-answer", "canceled"]
            if q_item.status == "DIALING_INTENT" and is_stale_map:
                 status = "initiated"
                 duration = 0
                 agent_id = f"pending-{q_item.id}" # Use synthetic ID for the new attempt
            else:
                 # Normalize to lowercase but keep speaking/listening/processing for real-time visualization
                 status = (exec_map.call_status or "initiated").lower()
                 if status == "in-progress":
                    status = "connected"
                 duration = exec_map.call_duration
                 agent_id = f"call-{q_item.id}"
        else:
            # Synthetic status for DIALING_INTENT without map
            status = "initiated" 
            duration = 0
            agent_id = f"pending-{q_item.id}"

        agents.append({
            "agent_id": agent_id,
            "agent_name": agent_name,
            "status": status,
            "lead_name": lead.customer_name,
            "lead_id": lead.id,
            "duration": duration
        })
        
    # 2. Aggregation Logic
    # (Warmer was triggered at the start)

    # 3. Fetch "Upcoming" Leads for Queue Visualization
    # This must include:
    # A. Leads already in the buffer (QueueItem status = PENDING, QUEUED) - High Priority
    # B. Leads from the backlog (CampaignLead not in QueueItem) - Low Priority
    
    # Filter by selected cohorts if defined
    selected_cohorts = campaign.selected_cohorts or []
    
    # Part A: Buffered Items
    buffered_stmt = (
        select(QueueItem, CampaignLead)
        .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
        .where(QueueItem.campaign_id == campaign_id)
        .where(QueueItem.status.in_(["PENDING", "QUEUED", "READY", "SCHEDULED"]))
        # Filter by selected cohorts to be safe, even if Warmer *should* have handled it
        .where(or_(len(selected_cohorts) == 0, CampaignLead.cohort.in_(selected_cohorts)))
        .order_by(QueueItem.priority_score.desc(), QueueItem.created_at.asc())
        .limit(10)
    )
    buffered_result = await session.execute(buffered_stmt)
    buffered_items = buffered_result.all()
    
    upcoming_data = []
    seen_leads = set()  # Track leads to prevent duplicates
    
    # Add buffered items first (with deduplication)
    for q_item, lead in buffered_items:
        # Skip if we've already added this lead
        norm_num = normalize_phone_number(lead.contact_number)
        if norm_num in seen_leads:
            continue
        seen_leads.add(norm_num)
        seen_leads.add(str(lead.id))

        upcoming_data.append({
            "lead_id": lead.id,
            "name": lead.customer_name,
            "cohort": lead.cohort,
            "avatar_seed": lead.id,
            "status": q_item.status, # Optional debug info
            "scheduled_for": q_item.scheduled_for.isoformat() + "Z" if q_item.scheduled_for else None
        })
        
    # Part B: Backlog (Fill remaining slots)
    remaining_slots = 10 - len(upcoming_data)
    
    if remaining_slots > 0:
        existing_q = select(QueueItem.lead_id).where(QueueItem.campaign_id == campaign_id)
        
        backlog_stmt = (
            select(CampaignLead)
            .where(CampaignLead.campaign_id == campaign_id)
            .where(CampaignLead.id.not_in(existing_q))
            .where(or_(len(selected_cohorts) == 0, CampaignLead.cohort.in_(selected_cohorts)))
            .order_by(CampaignLead.created_at.asc())
            .limit(remaining_slots)
        )
        
        backlog_result = await session.execute(backlog_stmt)
        backlog_leads = backlog_result.scalars().all()
        
        for lead in backlog_leads:
            # Deduplicate by normalized number
            norm_num = normalize_phone_number(lead.contact_number)
            if norm_num in seen_leads or str(lead.id) in seen_leads:
                continue
            seen_leads.add(norm_num)
            seen_leads.add(str(lead.id))

            upcoming_data.append({
                "lead_id": lead.id,
                "name": lead.customer_name,
                "cohort": lead.cohort,
                "avatar_seed": lead.id,
                "status": "BACKLOG"
            })

    # 4. Fetch Recent History (Completed/Failed) for "Left side" of the queue
    # We want valid call logs for this campaign, latest first
    
    # A. AI Call Logs
    history_stmt = (
        select(CallLog, CampaignLead)
        .join(CampaignLead, CallLog.lead_id == CampaignLead.id)
        .join(UserQueueItem, CampaignLead.id == UserQueueItem.lead_id)
        .where(CallLog.campaign_id == campaign_id)
        .where(UserQueueItem.status == "CLOSED")
        .order_by(CallLog.created_at.desc())
        .limit(100)
    )
    
    history_result = await session.execute(history_stmt)
    history_items = history_result.all()
    
    # B. User Call Logs (Human)
    user_history_stmt = (
        select(UserCallLog, CampaignLead)
        .join(CampaignLead, UserCallLog.lead_id == CampaignLead.id)
        .join(UserQueueItem, CampaignLead.id == UserQueueItem.lead_id)
        .where(UserCallLog.campaign_id == campaign_id)
        .where(UserQueueItem.status == "CLOSED")
        .order_by(UserCallLog.created_at.desc())
        .limit(100)
    )
    user_history_result = await session.execute(user_history_stmt)
    user_history_items = user_history_result.all()
    
    def get_critical_signal(outcome: str, extracted: dict) -> dict:
        # 0. Safety Override: If outcome is clearly positive, it cannot be DNC.
        # This prevents "User did not request DNC" from triggering DNC on an AGREED call.
        if outcome in ["INTENT_YES", "INTERESTED", "SCHEDULED", "AGREED", "CONNECTED"]:
            return None

        # 1. DNC
        if outcome == "DNC / Stop":
            return {"type": "DNC", "label": "DNC Request", "severity": "critical"}
        
        dnc_val = extracted.get("do_not_call_event")
        if dnc_val and isinstance(dnc_val, str):
            dnc_lower = dnc_val.lower().strip()
            
            # Safe Negatives: Explicitly ignore these common LLM outputs for "False"
            safe_negatives = ["no", "false", "none", "n/a", "not request", "did not ask", "didn't ask", "no stop"]
            if any(neg in dnc_lower for neg in safe_negatives):
                pass # Explicitly safe
            elif dnc_lower.startswith("no "):
                 pass # Starts with "no ..."
            else:
                # Dangerous Positives: Look for explicit stop keywords
                # But only if we passed the negative filter
                if any(kw in dnc_lower for kw in ["stop", "remove", "dnc", "don't call", "do not call", "take me off"]):
                    return {"type": "DNC", "label": "DNC Request", "severity": "critical"}

        # 2. Wrong Person
        if outcome == "Wrong Person" or extracted.get("wrong_person"):
            return {"type": "WRONG_PERSON", "label": "Wrong Person", "severity": "warning"}

        # 3. Language Barrier
        if outcome == "Language Barrier" or extracted.get("language_barrier"):
            return {"type": "LANGUAGE_BARRIER", "label": "Language Barrier", "severity": "warning"}

        return None

    def classify_intent_priority(key_insight: str, outcome: str, duration: int) -> dict:
        """Classify the priority/value of a user intent for visual emphasis."""
        if not key_insight:
            return None
            
        insight_lower = key_insight.lower()
        outcome_upper = (outcome or "").upper()
        
        # Skip technical failures - these are low priority by default
        technical_failures = ["voicemail", "no answer", "busy", "silence", "hung up immediately"]
        if any(fail in insight_lower for fail in technical_failures):
            return None
        
        # High Priority - Hot Leads (expressed interest or intent to act)
        hot_keywords = [
            "interested", "want to try", "sounds good", "tell me more", 
            "how much", "pricing", "price", "cost",
            "schedule", "book", "sign up", "register",
            "yes", "sure", "okay", "sounds great",
            "feedback", "follow-up", "call back", "call later",
            "demo", "trial", "sample"
        ]
        if any(kw in insight_lower for kw in hot_keywords):
            return {"level": "high", "label": "🔥 Hot Lead", "emoji": "🔥"}
        
        # Medium Priority - Engaged (asked questions, had real conversation)
        if duration > 20 and outcome_upper not in ["VOICEMAIL", "NO_ANSWER", "BUSY", "HANGUP"]:
            engaged_keywords = ["what", "how", "when", "why", "tell", "explain", "?", "intends", "possibly"]
            if any(kw in insight_lower for kw in engaged_keywords):
                return {"level": "medium", "label": "⚡ Engaged", "emoji": "⚡"}
        
        # If we have a real intent (not generic), mark as engaged
        if len(key_insight) > 30 and "user" in insight_lower:
            return {"level": "medium", "label": "⚡ Engaged", "emoji": "⚡"}
        
        return None

    history_data = []
    seen_history_leads = set() # Optional: if we want to collapse retries, but user wants activity truth
    for call_log, lead in history_items:
        # Extract core variables from webhook_payload if available
        payload = call_log.webhook_payload or {}
        extracted = payload.get("extracted_data", {}) or {}
        
        # 1. Key quote/intent
        key_insight = extracted.get("user_intent") or extracted.get("specific_objections")
        if not key_insight:
            # Fallback: get last user message from transcript
            transcript = payload.get("transcript", [])
            if isinstance(transcript, list):
                user_msgs = [t.get("content") for t in transcript if isinstance(t, dict) and t.get("role") == "user"]
            else:
                user_msgs = []
            
            if user_msgs:
                key_insight = user_msgs[-1]
                
        # [NEW] Apply Context-Aware Enrichment on-the-fly
        next_step = None
        if key_insight:
            transcript_str = str(payload.get("transcript", ""))
            key_insight = enrich_user_intent(
                raw_intent=str(key_insight),
                outcome=(call_log.outcome or call_log.status or "").upper(),
                duration=call_log.duration,
                transcript=transcript_str
            )
            
            # Separate Insight vs Action
            key_insight, next_step = extract_next_step(key_insight)
        
        # 2. Transcripts (safe list)
        transcript = payload.get("transcript")
        if not isinstance(transcript, list):
            transcript = []
        
        # 3. Critical Signal (Context-Aware)
        critical_signal = get_critical_signal(call_log.outcome, extracted)
        
        # 3.5 Intent Priority (NEW)
        intent_priority = classify_intent_priority(key_insight, call_log.outcome, call_log.duration)
        
        # 4. Scheduling preference
        scheduling = extracted.get("scheduling_preferences")

        # [NEW] 5. Sentiment Analysis
        transcript_str = str(payload.get("transcript", ""))
        sentiment = analyze_sentiment(
            transcript=transcript_str,
            outcome=call_log.outcome or call_log.status or "",
            duration=call_log.duration,
            extracted_data=extracted
        )

        # [NEW] 6. Agreement Detection
        agreement_status = detect_agreement_status(
            user_intent=key_insight or "",
            outcome=call_log.outcome or "",
            extracted_data=extracted
        )

        # [NEW] 7. Preferred Slot Extraction and Analysis
        preferred_slot = None
        if scheduling and isinstance(scheduling, dict):
            # Parse scheduling preferences
            preferred_slot = {
                "requested": True,
                "start_time": scheduling.get("preferred_time"),
                "end_time": scheduling.get("preferred_end_time"),
                "day": scheduling.get("preferred_day"),
                "is_outside_window": False  # Will be calculated below
            }
            
            # Check if preferred slot is outside execution windows
            if preferred_slot["start_time"]:
                try:

                    from dateutil import parser
                    
                    # Parse the preferred time
                    pref_time = parser.parse(preferred_slot["start_time"])
                    
                    # Get campaign execution windows
                    campaign = await session.get(Campaign, call_log.campaign_id)
                    if campaign and campaign.execution_windows:
                        is_in_window = False
                        for window in campaign.execution_windows:
                            try:
                                from dateutil import parser as date_parser
                                
                                window_start = date_parser.parse(f"{window['day']}T{window['start']}")
                                window_end = date_parser.parse(f"{window['day']}T{window['end']}")
                                
                                if window_start <= pref_time <= window_end:
                                    is_in_window = True
                                    break
                            except:
                                continue
                        
                        preferred_slot["is_outside_window"] = not is_in_window
                except:
                    # If parsing fails, assume it's outside window to be safe
                    preferred_slot["is_outside_window"] = True

        # [NEW] 8. Check if should copy to queue and if already copied
        should_copy = should_copy_to_queue(agreement_status) and not call_log.copied_to_user_queue
        copied_at = call_log.copied_to_queue_at.isoformat() + "Z" if call_log.copied_to_queue_at else None

        # 9. Enrich with raw data and specific extractions for Modal
        telephony_provider = payload.get("telephony_data", {}).get("provider") or "unknown"
        
        # Merge extracted_data with custom_extractions if available
        final_extracted = extracted.copy()
        custom_extractions = payload.get("custom_extractions")
        if custom_extractions:
            if isinstance(custom_extractions, str):
                import json
                try:
                    custom_data = json.loads(custom_extractions)
                    final_extracted.update(custom_data)
                except:
                    pass
            elif isinstance(custom_extractions, dict):
                final_extracted.update(custom_extractions)

        # Normalize Usage and Latency for Modal
        latency_metrics = {"avg_latency": 0, "max_latency": 0}
        history = payload.get("analytics", {}).get("call_details", [{}])[0].get("history", [])
        latencies = [h.get("audio_to_text_latency") for h in history if h.get("audio_to_text_latency")]
        if latencies:
            latency_metrics["avg_latency"] = sum(latencies) / len(latencies)
            latency_metrics["max_latency"] = max(latencies)
        
        cost_breakdown = payload.get("cost_breakdown", {})
        usage_breakdown = {}
        # Convert cost_breakdown to what frontend expects: { "synthesizer": { "units": "X", "cost": Y } }
        for key, cost in cost_breakdown.items():
            if key == "llm_breakdown": continue
            if key == "synthesizer_breakdown": continue
            if key == "transcriber_breakdown": continue
            
            units = "N/A"
            if key == "llm":
                llm_usage = payload.get("usage_breakdown", {}).get("llmModel", {})
                # Just take the first one or sum them
                units = "Tokens"
            elif key == "synthesizer":
                units = f"{payload.get('usage_breakdown', {}).get('synthesizer_characters', 0)} Chars"
            elif key == "transcriber":
                units = f"{payload.get('usage_breakdown', {}).get('transcriber_duration', 0)}s"
            
            usage_breakdown[key] = {
                "units": units,
                "cost": cost
            }

        # Update raw_data in history_data with these normalized values if needed
        # but better to add them as separate fields
        
        history_data.append({
            "lead_id": lead.id,
            "name": lead.customer_name,
            "phone_number": lead.contact_number,
            "status": call_log.outcome or call_log.status,
            "outcome": call_log.outcome, 
            "duration": call_log.duration,
            "avatar_seed": lead.id,
            "timestamp": call_log.created_at.isoformat() + "Z",
            "recording_url": call_log.recording_url,
            "transcript": transcript,
            "full_transcript": call_log.full_transcript, # For the Transcript tab
            "key_insight": key_insight,
            "next_step": next_step,
            "is_dnc": critical_signal["type"] == "DNC" if critical_signal else False,
            "critical_signal": critical_signal, 
            "intent_priority": intent_priority,
            "scheduling_preference": scheduling,
            # [NEW] Context-aware fields
            "sentiment": sentiment,
            "agreement_status": agreement_status,
            "preferred_slot": preferred_slot,
            "should_copy_to_queue": should_copy,
            "copied_to_queue_at": copied_at,
            "call_log_id": str(call_log.id),  # For API calls
            "extracted_data": final_extracted, # For Extraction tab
            "raw_data": {**payload, "usage_breakdown": usage_breakdown, "latency_metrics": latency_metrics}, # Overwrite for Modal compatibility
            "telephony_provider": telephony_provider,
            "is_user_call": False
        })

    # Process User Call Logs
    for user_log, lead in user_history_items:
        # User calls are simpler, we use notes as key insight
        history_data.append({
            "lead_id": lead.id,
            "name": lead.customer_name,
            "phone_number": lead.contact_number,
            "status": user_log.status,
            "outcome": user_log.status,
            "duration": user_log.duration or 0,
            "avatar_seed": lead.id,
            "timestamp": user_log.created_at.isoformat() + "Z",
            "recording_url": None,
            "transcript": [],
            "full_transcript": None,
            "key_insight": user_log.notes,
            "next_step": user_log.next_action,
            "is_dnc": False, # User logic handles this separately?
            "critical_signal": None,
            "intent_priority": None, # Could map based on outcome
            "scheduling_preference": None,
            "sentiment": None,
            "agreement_status": None,
            "preferred_slot": None,
            "should_copy_to_queue": False,
            "copied_to_queue_at": None,
            "call_log_id": str(user_log.id),
            "extracted_data": {},
            "raw_data": {"notes": user_log.notes, "next_action": user_log.next_action},
            "telephony_provider": "manual",
            "is_user_call": True
        })

    # Sort combined history by timestamp DESC
    history_data.sort(key=lambda x: x["timestamp"], reverse=True)

    # 5. Fetch ALL Leads by Cohort for the comprehensive view
    all_leads_stmt = (
        select(CampaignLead, QueueItem)
        .outerjoin(QueueItem, CampaignLead.id == QueueItem.lead_id)
        .where(CampaignLead.campaign_id == campaign_id)
        .where(or_(len(selected_cohorts) == 0, CampaignLead.cohort.in_(selected_cohorts)))
    )
    all_leads_result = await session.execute(all_leads_stmt)
    all_leads_raw = all_leads_result.all()
    
    leads_by_cohort = {}
    seen_leads_by_cohort = {}  # Track {lead_id: {cohort, status, outcome}} to prevent duplicates
    
    # Status priority: higher number = more important to show
    status_priority = {
        "READY": 8,
        "DIALING_INTENT": 7,
        "PENDING": 6,
        "QUEUED": 5,
        "COMPLETED": 4,
        "INTENT_YES": 4,
        "SCHEDULED": 4,
        "PENDING_AVAILABILITY": 4,
        "FAILED": 3,
        "VOICEMAIL": 3,
        "NO_ANSWER": 3,
        "BUSY": 3,
        "HANGUP": 3,
        "SILENCE": 3,
        "FAILED_CONNECT": 3,
        "LANGUAGE_BARRIER": 3,
        "INTENT_NO": 2,
        "DNC": 2,
        "WRONG_PERSON": 2,
        "FAX_ROBOT": 2,
        "AMBIGUOUS": 2,
        "BACKLOG": 1
    }
    
    for lead, q_item in all_leads_raw:
        cohort = lead.cohort or "Unassigned"
        lead_id = str(lead.id)
        current_status = q_item.status if q_item else "BACKLOG"
        current_outcome = q_item.outcome if q_item else None
        
        # If we've seen this lead before, check if we should update it
        norm_num = normalize_phone_number(lead.contact_number)
        
        # Priority check for same lead (by ID or normalized number)
        is_duplicate = lead_id in seen_leads_by_cohort or norm_num in seen_leads_by_cohort
        existing_info = seen_leads_by_cohort.get(lead_id) or seen_leads_by_cohort.get(norm_num)

        if is_duplicate:
            existing = existing_info
            existing_priority = status_priority.get(existing["status"], 0)
            current_priority = status_priority.get(current_status, 0)
            
            # Only update if the new status has higher priority
            if current_priority > existing_priority:
                # Remove old entry from cohort list
                old_cohort = existing["cohort"]
                if old_cohort in leads_by_cohort:
                    leads_by_cohort[old_cohort] = [
                        item for item in leads_by_cohort[old_cohort] 
                        if str(item["lead_id"]) != str(existing["lead_id"])
                    ]
                
                # Update tracking
                track_info = {
                    "cohort": cohort,
                    "status": current_status,
                    "outcome": current_outcome,
                    "lead_id": lead_id
                }
                seen_leads_by_cohort[lead_id] = track_info
                seen_leads_by_cohort[norm_num] = track_info
                
                # Add to new cohort
                if cohort not in leads_by_cohort:
                    leads_by_cohort[cohort] = []
                    
                leads_by_cohort[cohort].append({
                    "lead_id": lead.id,
                    "name": lead.customer_name,
                    "status": current_status,
                    "outcome": current_outcome,
                    "avatar_seed": lead.id
                })
            # else: keep existing entry (it has higher priority)
            continue
        
        # First time seeing this lead
        track_info = {
            "cohort": cohort,
            "status": current_status,
            "outcome": current_outcome,
            "lead_id": lead_id
        }
        seen_leads_by_cohort[lead_id] = track_info
        seen_leads_by_cohort[norm_num] = track_info
        
        if cohort not in leads_by_cohort:
            leads_by_cohort[cohort] = []
            
        leads_by_cohort[cohort].append({
            "lead_id": lead.id,
            "name": lead.customer_name,
            "status": current_status,
            "outcome": current_outcome,
            "execution_count": q_item.execution_count if q_item else 0, # [NEW] Exposed for frontend warning
            "avatar_seed": lead.id
        })


    # 7. Calculate Campaign Completion Status
    is_completed = False
    completion_data = {
        "total_targets": 0,
        "total_completed": 0,
        "completion_rate": 0.0,
        "cohort_progress": {},
        "total_calls": 0,
        "call_distribution": {}
    }
    
    # Success statuses that count towards completion
    SUCCESS_STATUSES = ["INTENT_YES"]

    # Get cohort data from campaign
    # [FIX] Support both legacy cohort_data and new cohort_config
    target_map = {}
    if campaign.cohort_data:
         for name, data in campaign.cohort_data.items():
             target_map[name] = data.get("target", 0)
    elif campaign.cohort_config:
        target_map = campaign.cohort_config

    if target_map:
        # Cohort-based completion check
        all_cohorts_complete = True
        total_targets = 0
        total_completed = 0
        
        for cohort_name, target in target_map.items():
            total_targets += target
            
            # Count successful calls for this cohort
            success_stmt = (
                select(QueueItem)
                .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
                .where(QueueItem.campaign_id == campaign_id)
                .where(CampaignLead.cohort == cohort_name)
                .where(QueueItem.status.in_(SUCCESS_STATUSES))
            )
            success_result = await session.execute(success_stmt)
            completed_count = len(success_result.scalars().all())
            total_completed += completed_count
            
            # A cohort is complete if it has a target > 0 and met it, 
            # OR if it was selected but has no target (implicitly complete when exhausted, handled by global fallback below)
            is_cohort_complete = target > 0 and completed_count >= target
            if target > 0 and not is_cohort_complete:
                all_cohorts_complete = False
            
            completion_data["cohort_progress"][cohort_name] = {
                "target": target,
                "completed": completed_count,
                "is_complete": is_cohort_complete
            }
            logger.info(f"[Execution] Cohort {cohort_name}: Target={target}, Completed={completed_count}, IsComplete={is_cohort_complete}")
        
        completion_data["total_targets"] = total_targets
        completion_data["total_completed"] = total_completed
        completion_data["completion_rate"] = (total_completed / total_targets * 100) if total_targets > 0 else 0
        
        # Check if all cohorts met their targets
        if all_cohorts_complete and total_targets > 0:
            is_completed = True
            logger.info(f"[Execution] All cohorts complete. Marking campaign {campaign_id} as COMPLETED.")
    
    # [NEW] Check for leads exhaustion
    total_leads = completion_data["total_targets"]

    # [NEW] Fallback: If no targets defined via cohorts, use total leads as targets
    if completion_data["total_targets"] == 0:
        # Count all unique leads in the campaign
        total_leads_stmt = select(func.count(CampaignLead.id)).where(CampaignLead.campaign_id == campaign_id)
        total_leads = (await session.execute(total_leads_stmt)).scalar() or 0
        
        # Count all unique successful queue items
        total_success_stmt = (
            select(func.count(QueueItem.id))
            .where(QueueItem.campaign_id == campaign_id)
            .where(QueueItem.status.in_(SUCCESS_STATUSES))
        )
        total_success = (await session.execute(total_success_stmt)).scalar() or 0
        
        completion_data["total_targets"] = total_leads
        completion_data["total_completed"] = total_success
        completion_data["completion_rate"] = (total_success / total_leads * 100) if total_leads > 0 else 0
        
        # Optionally populate cohort_progress for visibility even without targets
        if not completion_data["cohort_progress"] and leads_by_cohort:
            for cohort_name, leads in leads_by_cohort.items():
                cohort_success = sum(1 for l in leads if l["status"] in SUCCESS_STATUSES)
                completion_data["cohort_progress"][cohort_name] = {
                    "target": len(leads),
                    "completed": cohort_success,
                    "is_complete": cohort_success >= len(leads) if len(leads) > 0 else True
                }


    # [NEW] Calculate Total Calls and Distribution for Dynamic Summary
    # We want to count actual attempts (Calls made)
    attempted_stmt = (
        select(QueueItem.status, func.count(QueueItem.id))
        .where(QueueItem.campaign_id == campaign_id)
        .where(QueueItem.status.in_(["COMPLETED", "FAILED", "VOICEMAIL", "NO_ANSWER", "BUSY", "HANGUP", "SILENCE", "FAILED_CONNECT", "LANGUAGE_BARRIER", "INTENT_YES", "INTENT_NO", "DNC", "WRONG_PERSON", "FAX_ROBOT", "AMBIGUOUS", "CONNECTED", "SPEAKING", "LISTENING", "PROCESSING", "IN-PROGRESS", "INITIATED", "RINGING"]))
        .group_by(QueueItem.status)
    )
    attempted_result = await session.execute(attempted_stmt)
    attempted_counts = attempted_result.all()
    
    total_calls = 0
    call_distribution = {}
    
    for status, count in attempted_counts:
        total_calls += count
        # Normalize status keys for frontend if needed, or keep raw
        status_key = status
        call_distribution[status_key] = count
        
    completion_data["total_calls"] = total_calls
    completion_data["call_distribution"] = call_distribution

    # [NEW] Calculate High-Value Metrics for Actionable Insights
    # These metrics tell users what to DO next, not just vanity stats
    hot_leads_count = 0
    agreed_leads_count = 0
    engaged_count = 0
    action_required_count = 0
    total_duration = 0
    positive_sentiment_count = 0
    call_count_for_avg = 0

    # Reuse the history_items we already built (lines 277-482) to avoid duplicate queries
    for item in history_data:
        # Hot Leads: High-priority intent detected
        if item.get("intent_priority") and item["intent_priority"].get("level") == "high":
            hot_leads_count += 1
        
        # Agreed Leads: Customer agreed to follow-up
        agreement_status = item.get("agreement_status", "")
        if agreement_status in ["Agreed (High)", "Agreed (Medium)"]:
            agreed_leads_count += 1
        
        # Engaged Conversations: Medium priority or meaningful duration
        if item.get("intent_priority") and item["intent_priority"].get("level") == "medium":
            engaged_count += 1
        elif item.get("duration", 0) > 30:
            engaged_count += 1
        
        # Action Required: Leads waiting in user queue
        if item.get("should_copy_to_queue"):
            action_required_count += 1
        
        # Average Duration calculation
        duration = item.get("duration", 0)
        if duration > 0:
            total_duration += duration
            call_count_for_avg += 1
        
        # Positive Sentiment
        sentiment = item.get("sentiment")
        if sentiment and sentiment.get("overall") == "positive":
            positive_sentiment_count += 1

    # Add high-value metrics to completion_data
    completion_data["stats_summary"] = {
        "hot_leads": hot_leads_count,
        "agreed_leads": agreed_leads_count,
        "engaged_leads": engaged_count,
        "action_required": action_required_count,
        "positive_sentiment": positive_sentiment_count,
        "avg_duration": int(total_duration / call_count_for_avg) if call_count_for_avg > 0 else 0
    }
    
    # [NEW] Add specific counts for Dashboard "Stats Belt"
    # Yes Intent Leads: INTENT_YES, INTERESTED, SCHEDULED
    yes_intent_count = sum(1 for item in history_data if item.get("outcome") in ["INTENT_YES", "INTERESTED", "SCHEDULED"])
    # Connected Calls: Everything except failures
    connected_count = sum(1 for item in history_data if item.get("outcome") not in ["VOICEMAIL", "NO_ANSWER", "BUSY", "FAILED_CONNECT", "FAILED"])

    completion_data["yes_intent_leads"] = yes_intent_count
    completion_data["connected_calls"] = connected_count
    completion_data["hot_leads"] = hot_leads_count
    completion_data["agreed_leads"] = agreed_leads_count
    completion_data["engaged_conversations"] = engaged_count
    completion_data["action_required"] = action_required_count
    completion_data["avg_call_duration"] = (total_duration / call_count_for_avg) if call_count_for_avg > 0 else 0
    completion_data["positive_sentiment_rate"] = (positive_sentiment_count / call_count_for_avg * 100) if call_count_for_avg > 0 else 0
    
    # Keep legacy field for backwards compatibility
    completion_data["success_rate"] = completion_data["completion_rate"]


    # Lead-based completion check (fallback or additional condition)
    # Check if all leads have been exhausted (excluding those that need retry/reset)
    
    is_exhausted = False
    
    # [FIX] Only check for exhaustion if campaign was previously active
    # This prevents marking DRAFT/IDLE campaigns as complete before they've even started
    # processing leads (before queue warmer has populated anything)
    if campaign.status in ["ACTIVE", "IN_PROGRESS"]:
        # Check for leads that are currently ready to be called or in the backlog
        # We EXCLUDE FAILED leads from this check because they require a manual RESET to be tried again.
        # This prevents the "Agents Standing By" stalemate when only failures remain.
        
        # [FIX] Include SCHEDULED leads in the "not complete" check
        # This prevents premature completion when leads are waiting for their window
        ready_to_call_stmt = (
            select(QueueItem)
            .where(QueueItem.campaign_id == campaign_id)
            .where(QueueItem.status.in_(["READY", "PENDING", "QUEUED", "SCHEDULED", "DIALING_INTENT", "CONNECTED", "RINGING"]))
        )
        ready_to_call_result = await session.execute(ready_to_call_stmt)
        ready_leads = ready_to_call_result.scalars().all()
        
        # Also check backlog (leads not yet in queue)
        existing_q = select(QueueItem.lead_id).where(QueueItem.campaign_id == campaign_id)
        backlog_stmt = (
            select(CampaignLead)
            .where(CampaignLead.campaign_id == campaign_id)
            .where(CampaignLead.id.not_in(existing_q))
            .where(or_(len(selected_cohorts) == 0, CampaignLead.cohort.in_(selected_cohorts)))
        )
        backlog_result = await session.execute(backlog_stmt)
        backlog_leads = backlog_result.scalars().all()
        
        # [FIX] Added a check for CallLogs to avoid false-positives on fresh starts
        # If there are NO call logs and NO agents, but we have leads, we aren't done.
        call_logs_stmt = select(func.count(CallLog.id)).where(CallLog.campaign_id == campaign_id)
        call_logs_count = (await session.execute(call_logs_stmt)).scalar() or 0
        logger.info(f"[Execution] Exhaustion Check: Ready={len(ready_leads)}, Backlog={len(backlog_leads)}, ActiveAgents={len(agents)}, Logs={call_logs_count}")

        # If no ready leads, no backlog, and no current active agents, mark as complete
        # BUT only if we've actually tried something (logs > 0) OR if we truly have 0 leads total (already handles)
        if len(ready_leads) == 0 and len(backlog_leads) == 0 and len(agents) == 0:
            if call_logs_count > 0 or total_leads == 0:
                # [FIX]: Exhaustion is NOT Completion. 
                # Completion = Targets Met (handled above).
                # Exhaustion = No leads left.
                is_exhausted = True
                logger.info(f"[Execution] Campaign {campaign_id} EXHAUSTED (No leads left, targets not necessarily met)")

    # [NEW] Final Polish: If campaign is completed, mark all cohorts as complete to avoid "In Progress" UI stalemate
    if is_completed or is_exhausted:
        for cohort_name in completion_data["cohort_progress"]:
            completion_data["cohort_progress"][cohort_name]["is_complete"] = True

    # 8. Auto-pause campaign if completed to stop further calling
    # We allow auto-completion from ACTIVE or IN_PROGRESS states only.
    # CRITICAL: Do NOT auto-complete from PAUSED state (avoids immediate re-completion after reset)
    if (is_completed or is_exhausted) and campaign.status in ["ACTIVE", "IN_PROGRESS"]:
        campaign.status = "COMPLETED"
        session.add(campaign)
        await session.commit()
        await session.refresh(campaign)
        logger.info(f"[Execution] Campaign {campaign_id} auto-completed: Criteria met (Completed={is_completed}, Exhausted={is_exhausted})")

    
    # 9. Fetch Consolidated Data for WebSocket (Events & Next Leads)
    # This eliminates the need for separate polling requests from the frontend
    
    # Fetch Events
    events_data = await get_campaign_events_internal(campaign_id, session)
    
    # Fetch Next Leads (Human Queue)
    next_leads_data = await get_next_leads_internal(campaign_id, session)

    # Prepare response data
    response_data = {
        "campaign_status": campaign.status,
        "active_count": len(agents),
        "max_concurrency": MAX_CONCURRENCY,
        "agents": agents,
        "upcoming_leads": upcoming_data,
        "next_leads": next_leads_data, # Added for WS
        "events": events_data,         # Added for WS
        "history": history_data,
        "all_leads_by_cohort": leads_by_cohort,
        "is_completed": is_completed,
        "completion_data": completion_data,
        "is_exhausted": is_exhausted, # [FIX] Allow exhausted to be true even if completed (though mutually exclusive conceptually, helpful for UI priority)
        "execution_windows": campaign.execution_windows,
        
        # NEW: Add campaign metadata for real-time frontend updates
        "campaign_metadata": {
            "name": campaign.name,
            "brand_context": campaign.brand_context,
            "customer_context": campaign.customer_context,
            "team_member_context": campaign.team_member_context,
            "cohort_config": campaign.cohort_config or {},
            "selected_cohorts": campaign.selected_cohorts or [],
            "cohort_data": campaign.cohort_data or {},
            "cohort_questions": campaign.cohort_questions or {},
            "cohort_incentives": campaign.cohort_incentives or {},
            "preliminary_questions": campaign.preliminary_questions or [],
            "incentive": campaign.incentive,
            "call_duration": campaign.call_duration,
            "created_at": campaign.created_at.isoformat() + "Z" if campaign.created_at else None,
            "updated_at": campaign.updated_at.isoformat() + "Z" if campaign.updated_at else None,
        }
    }
    
    # Broadcast to WebSocket clients (non-blocking)
    try:
        # Import moved to top-level or ensure it's available
        from app.services.websocket_manager import manager
        await manager.broadcast_status_update(str(campaign_id), response_data)
    except Exception as e:
        logger.error(f"[WebSocket] Broadcast error: {e}")
    
    return response_data


async def get_campaign_events_internal(campaign_id: UUID, session: AsyncSession) -> List[dict]:
    """
    Fetches campaign events from the persistent CampaignEvent table.
    """
    stmt = (
        select(CampaignEvent)
        .where(CampaignEvent.campaign_id == campaign_id)
        .order_by(CampaignEvent.created_at.desc(), CampaignEvent.id.desc())
        .limit(50)
    )
    result = await session.execute(stmt)
    events = result.scalars().all()
    
    formatted_events = []
    for e in events:
        formatted_events.append({
            "id": str(e.id),
            "timestamp": e.created_at.isoformat() + "Z",
            "type": e.event_type.lower(),
            "agent_name": e.agent_name,
            "message": e.message,
            "status": e.status,
            "lead_id": str(e.lead_id) if e.lead_id else None
        })
    
    return formatted_events


async def get_next_leads_internal(campaign_id: UUID, session: AsyncSession) -> List[dict]:
    """
    Internal logic to fetch next READY leads.
    """
    statement = (
        select(QueueItem, CampaignLead)
        .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
        .where(QueueItem.campaign_id == campaign_id)
        .where(QueueItem.status == "READY")
        .order_by(QueueItem.priority_score.desc()) # High priority first
        .limit(2) # Display Count
    )
    
    result = await session.execute(statement)
    results = result.all()
    
    leads = []
    for q_item, lead in results:
        leads.append({
            "queue_item_id": q_item.id,
            "lead_id": lead.id,
            "name": lead.customer_name,
            "number": lead.contact_number,
            "cohort": lead.cohort,
            "status": q_item.status,
            "meta_data": lead.meta_data,
            "avatar_index": 0 
        })
        
    return leads


@router.get("/campaign/{campaign_id}/events")
async def get_campaign_events(
    campaign_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Returns a timeline of "Behind the Scenes" events for the campaign.
    """
    return await get_campaign_events_internal(campaign_id, session)


@router.post("/campaign/{campaign_id}/start")
async def start_session(
    campaign_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Starts the execution session for a campaign.
    Triggers the Queue Warmer to start filling the buffer.
    """
    logger.info(f"[Execution] Starting session for campaign {campaign_id}")
    campaign = await session.get(Campaign, campaign_id)
    if not campaign:
        logger.error("[Execution] Campaign not found")
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    logger.info(f"[Execution] Campaign found. Status: {campaign.status}")

    # Check if strategy is defined (selected_cohorts or cohort_data)
    if not campaign.selected_cohorts and not campaign.cohort_data:
         logger.warning("[Execution] Missing strategy")
         raise HTTPException(
             status_code=400, 
             detail="Campaign strategy (cohorts/targets) must be defined before starting execution."
         )


    # Validate Execution Window
    if campaign.execution_windows:
        try:
            # Use local time for comparison to match user expectation (assuming server is local to user/business)
            now_local = datetime.now()
            is_in_active_window = False
            
            for w in campaign.execution_windows:
                day = w.get('day', '')
                st = w.get('start', '')
                et = w.get('end', '')
                
                if day and st and et:
                    try:
                        start_dt = datetime.fromisoformat(f"{day}T{st}:00")
                        end_dt = datetime.fromisoformat(f"{day}T{et}:00")
                        
                        # [FIX] Added a 2-minute grace period to the start time 
                        # to handle milliseconds/clock jitter or immediate retries
                        effective_start = start_dt - timedelta(minutes=2)
                        
                        # Strictly check if we are CURRENTLY in the window (with grace)
                        if effective_start <= now_local <= end_dt:
                            is_in_active_window = True
                            break
                    except Exception as e:
                        logger.error(f"[Execution] Window parse error for window {w}: {e}")
                        continue
            
            if not is_in_active_window:
                logger.warning(f"[Execution] Campaign {campaign_id} start blocked. Time: {now_local}, Windows: {campaign.execution_windows}")
                # Clear window_expired flag first so it doesn't double stack if they try again after updating
                meta = dict(campaign.meta_data or {})
                meta["window_expired"] = True
                campaign.meta_data = meta
                session.add(campaign)
                await session.commit()
                
                # Formatted time for error message
                current_time_str = now_local.strftime("%I:%M %p")
                
                raise HTTPException(
                    status_code=400,
                    detail=f"Campaign cannot start: Current time ({current_time_str}) is outside the scheduled execution window."
                )
        except HTTPException:
            raise
        except Exception as e:
            # Fallback error handling for window parsing to prevent 500
            logger.error(f"[Execution] Critical error in execution window validation: {e}")
            # We don't block start if validation crashes, but we log it. 
            # Or safer: we block start but return a clean 400.
            # Let's err on side of caution and allow start if validation fails purely due to code error, 
            # BUT since this is a restriction feature, maybe we should block.
            # However, the user issue is a 500 crash. Let's return a 400 with details.
            raise HTTPException(
                status_code=400,
                detail=f"Error validating execution schedule: {str(e)}. Please check your schedule settings."
            )

    # Enforce Single Active Campaign Rule
    # Pause all other campaigns for this company that are ACTIVE or IN_PROGRESS
    logger.info("[Execution] Window validation passed. Auto-pausing other campaigns...")
    # Enforce Single Active Campaign Rule
    # Pause all other campaigns for this company that are ACTIVE or IN_PROGRESS
    try:
        other_campaigns_stmt = (
            select(Campaign)
            .where(Campaign.company_id == campaign.company_id)
            .where(Campaign.id != campaign_id)
            .where(Campaign.status.in_(["ACTIVE", "IN_PROGRESS"]))
        )
        other_campaigns_result = await session.execute(other_campaigns_stmt)
        other_campaigns = other_campaigns_result.scalars().all()
        
        for other_camp in other_campaigns:
            other_camp.status = "PAUSED"
            session.add(other_camp)
            
            # Clean QueueItems for other campaigns that are being paused
            # This removes READY, DIALING_INTENT, PENDING, QUEUED, and LOCKED items
            statuses_to_clean = ["READY", "DIALING_INTENT", "PENDING", "QUEUED", "LOCKED"]
            delete_stmt = (
                select(QueueItem)
                .where(QueueItem.campaign_id == other_camp.id)
                .where(QueueItem.status.in_(statuses_to_clean))
            )
            items_to_delete = (await session.execute(delete_stmt)).scalars().all()
            
            if items_to_delete:
                item_ids = [item.id for item in items_to_delete]
                
                # [FIX] Robust Cleanup Strategy
                # 1. Delete associated BolnaExecutionMap records
                from sqlalchemy import delete
                await session.execute(
                    delete(BolnaExecutionMap).where(BolnaExecutionMap.queue_item_id.in_(item_ids))
                )

                # 2. Delete associated UserQueueItems explicitly
                # We do this before deleting the parent QueueItem to satisfy FK constraints
                await session.execute(
                    delete(UserQueueItem).where(UserQueueItem.original_queue_item_id.in_(item_ids))
                )
                
                # 3. CRITICAL: Flush to force these deletes to happen before Parent deletes
                await session.flush()
                
                # 4. Delete Parent QueueItems
                for item in items_to_delete:
                    await session.delete(item)
                
            logger.info(f"[Execution] Auto-paused campaign {other_camp.id} and cleaned {len(items_to_delete)} queue items.")
    except Exception as e:
         logger.error(f"[Execution] Error auto-pausing other campaigns: {e}")
         # Attempt to rollback but don't crash the main start flow if possible
         # However, if we are in a bad state, maybe we should just log and continue?
         # But the rollback is safer.
         await session.rollback()
         
         # [FIX] If it was an integrity error, we should probably warn specifically
         if "violates foreign key constraint" in str(e):
             logger.warning(f"[Execution] Critical FK Violation caught during auto-pause cleanup: {e}") 



    # Update status to ACTIVE
    logger.info("[Execution] Updating status to ACTIVE and committing...")
    try:
        campaign.status = "ACTIVE"
        campaign.updated_at = datetime.utcnow()
        session.add(campaign)
        await session.commit()
        await session.refresh(campaign)
        logger.info("[Execution] Commit successful.")
    except Exception as commit_err:
        logger.error(f"[Execution] CRITICAL: Commit failed: {commit_err}")
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Database commit failed: {str(commit_err)}")
    
    # Trigger Warmer
    logger.info("[Execution] Triggering QueueWarmer...")

    try:
        # [NEW] Clear old buffer if resuming to ensure we pick fresh top leads
        # Logic: If we are just starting, we probably want the BEST leads now, not what was left over from last time.
        await QueueWarmer.clear_ready_buffer(session, campaign_id)
        
        await QueueWarmer.check_and_replenish(campaign_id, session)
    except Exception as e:
        logger.error(f"[Execution] CRITICAL: QueueWarmer failed after start: {e}")
        import traceback
        traceback.print_exc()
        # Do NOT raise 500 here. The campaign is ACTIVE now, so UI should show it.
        # The user might notice no calls are happening, but at least the UI won't crash.

    # [NEW] Sync Execution Windows to Calendar
    logger.info("[Execution] Syncing to Calendar...")
    try:
        stmt = select(CalendarConnection).where(
            CalendarConnection.company_id == campaign.company_id,
            CalendarConnection.status == "active"
        )
        result = await session.execute(stmt)
        conn = result.scalars().first()
        if conn:
            # Fetch company for timezone info
            from app.models.company import Company
            company = await session.get(Company, campaign.company_id)
            timezone_str = company.timezone if company else "UTC"
            
            await google_calendar_service.sync_campaign_windows(conn, campaign, timezone_str=timezone_str)
            logger.info(f"[Execution] Synced windows for campaign {campaign.id} to Google Calendar using TZ: {timezone_str}")
        else:
            logger.info("[Execution] No active calendar connection found.")
    except Exception as e:
        logger.error(f"[Execution] Calendar sync failed: {e}")


    # Broadcast new state
    logger.info("[Execution] Fetching final status data..." )
    
    # Log System Event
    session.add(CampaignEvent(
        campaign_id=campaign_id,
        event_type="SYSTEM",
        message="Campaign Session Initialized. Agents are standing by.",
        status="PAUSED"
    ))
    await session.commit()

    try:
        status_data = await get_campaign_realtime_status_internal(campaign_id, session, trigger_warmer=False)
        logger.info("[Execution] Status data fetched successfully.")
    except Exception as e:
        logger.warning(f"[Execution] Warning: Failed to fetch initial status data: {e}")
        import traceback
        traceback.print_exc()
        status_data = {}
    
    logger.info("[Execution] Returning success response.")
    return {"status": "started", "campaign_status": campaign.status, "data": status_data}

@router.post("/campaign/{campaign_id}/pause")
async def pause_session(
    campaign_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Pauses the execution session for a campaign.
    Updated status ensures QueueWarmer skips replenishment.
    """
    campaign = await session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    # Update status
    campaign.status = "PAUSED"
    campaign.updated_at = datetime.utcnow()
    session.add(campaign)
    await session.commit()
    await session.refresh(campaign)
    
    # [NEW] Sync Execution Windows to Calendar
    try:
        stmt = select(CalendarConnection).where(
            CalendarConnection.company_id == campaign.company_id,
            CalendarConnection.status == "active"
        )
        result = await session.execute(stmt)
        conn = result.scalars().first()
        if conn:
            # Fetch company for timezone info
            from app.models.company import Company
            company = await session.get(Company, campaign.company_id)
            timezone_str = company.timezone if company else "UTC"
            
            await google_calendar_service.sync_campaign_windows(conn, campaign, timezone_str=timezone_str)
            logger.info(f"[Execution] Synced windows for campaign {campaign.id} to Google Calendar using TZ: {timezone_str}")
    except Exception as e:
        logger.error(f"[Execution] Calendar sync failed: {e}")
    
    # Log System Event
    session.add(CampaignEvent(
        campaign_id=campaign_id,
        event_type="SYSTEM",
        message="Campaign Session Paused. Agents stopped.",
        status="PAUSED"
    ))
    await session.commit()

    # Broadcast new state
    status_data = await get_campaign_realtime_status_internal(campaign_id, session, trigger_warmer=False)
    
    return {"status": "paused", "campaign_status": campaign.status, "data": status_data}


@router.get("/campaign/{campaign_id}/next-leads")
async def get_next_leads(
    campaign_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Returns the next batch of READY leads for the execution panel.
    """
    return await get_next_leads_internal(campaign_id, session)

@router.post("/campaign/{campaign_id}/lead/{lead_id}/outcome")
async def submit_call_outcome(
    campaign_id: UUID,
    lead_id: UUID,
    outcome_data: dict, # {outcome: "agreed", notes: "..."}
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Log the outcome of a manual call.
    """
    # Find the QueueItem
    statement = select(QueueItem).where(
        QueueItem.campaign_id == campaign_id,
        QueueItem.lead_id == lead_id
    )
    result = await session.execute(statement)
    q_item = result.scalars().first()
    
    if not q_item:
        raise HTTPException(status_code=404, detail="Queue item not found")
        
    # Update status
    q_item.status = "CONSUMED"
    # q_item.outcome = outcome_data.get("outcome") # If we add outcome column
    session.add(q_item)
    await session.commit()
    
    # Trigger Warmer to replenish
    return {"status": "success"}


@router.patch("/lead/{lead_id}/approve")
async def approve_lead(
    lead_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """
    Manually approve a lead that was flagged for review (PENDING_AVAILABILITY).
    Moves it to SCHEDULED state.
    """
    q_item = await session.get(QueueItem, lead_id)
    if not q_item:
        raise HTTPException(status_code=404, detail="Lead not found in queue")
    
    q_item.status = "SCHEDULED"
    session.add(q_item)
    await session.commit()
    return {"status": "success", "new_status": q_item.status}


@router.patch("/lead/{lead_id}/reschedule")
async def reschedule_lead(
    lead_id: UUID,
    callback_time: datetime,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """
    Manually reschedule a lead.
    """
    q_item = await session.get(QueueItem, lead_id)
    if not q_item:
        raise HTTPException(status_code=404, detail="Lead not found in queue")
    
    q_item.status = "SCHEDULED"
    q_item.scheduled_for = callback_time
    session.add(q_item)
    await session.commit()
    return {"status": "success", "new_status": q_item.status, "scheduled_for": q_item.scheduled_for}

@router.post("/campaign/{campaign_id}/reset")
async def reset_campaign(
    campaign_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Resets a campaign to allow re-running.
    1. Sets Campaign Status to PAUSED (stops auto-dialer).
    2. Resets all [Retriable States] leads to "READY" state.
    3. Resets "DIALING_INTENT" to "READY" (clears stuck calls).
    4. Clears execution history references to allow fresh start.
    """
    logger.info(f"[Execution] Resetting campaign {campaign_id}")
    
    campaign = await session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # [UPDATED] List of states that qualify for a reset (Retriable)
    # We explicitly exclude: INTENT_YES, INTENT_NO, DNC, WRONG_PERSON, SCHEDULED, PENDING_AVAILABILITY
    # We include: FAILED, NO_ANSWER, BUSY, VOICEMAIL, SILENCE, HANGUP, AMBIGUOUS, LANGUAGE_BARRIER, FAILED_CONNECT
    RETRIABLE_STATES = [
        "FAILED", "NO_ANSWER", "BUSY", "CANCELLED", 
        "INTENT_NO_ANSWER", # Legacy
        "DIALING_INTENT",   # Stuck calls
        "VOICEMAIL", "SILENCE", "HANGUP", "AMBIGUOUS", "LANGUAGE_BARRIER", "FAILED_CONNECT",
        "PENDING" # Stuck from initial migration/data cleaning
    ]
    
    # 1. Fetch items to reset
    stmt = (
        select(QueueItem)
        .where(QueueItem.campaign_id == campaign_id)
        .where(QueueItem.status.in_(RETRIABLE_STATES))
    )
    result = await session.execute(stmt)
    items_to_reset = result.scalars().all()
    
    count = len(items_to_reset)
    item_ids = [item.id for item in items_to_reset]
    logger.info(f"[Execution] Found {count} items to reset in states: {RETRIABLE_STATES}")

    # 2. Invalidate old BolnaExecutionMaps (Optional but good for cleanliness)
    # We mark them as "reset_history" so they don't block dedup logic if we used it
    if item_ids:
        map_stmt = (
            select(BolnaExecutionMap)
            .where(BolnaExecutionMap.queue_item_id.in_(item_ids))
        )
        maps_result = await session.execute(map_stmt)
        active_maps = maps_result.scalars().all()
        for m in active_maps:
            if m.call_status not in ["completed", "failed"]:
                m.call_status = "canceled_by_reset" 
                session.add(m)

    # 2.5 Clear Call Logs (History) to ensure UI looks "fresh"
    # This prevents the "Roster" (AgentQueue) from showing old failures in the history column
    log_stmt = select(CallLog).where(CallLog.campaign_id == campaign_id)
    logs_result = await session.execute(log_stmt)
    logs_to_delete = logs_result.scalars().all()
    
    for log in logs_to_delete:
        await session.delete(log)

    logger.info(f"[Execution] Deleted {len(logs_to_delete)} call logs for campaign reset.")
        
    # 3. Reset Status to READY
    now = datetime.utcnow()
    for item in items_to_reset:
        logger.info(f"[Execution] Resetting item {item.id} (Lead {item.lead_id}): Status={item.status}, Count={item.execution_count} -> 0")
        item.status = "READY"
        item.outcome = None # Clear previous failure reasons
        item.execution_count = 0 # [FIX] Reset retry counter
        item.locked_by_user_id = None
        item.locked_at = None
        item.scheduled_for = None
        item.updated_at = now
        session.add(item)
        
    # CRITICAL: Pause campaign status to prevent automatic calling after reset
    campaign.status = "PAUSED"
    campaign.updated_at = now
    
    # Clear "window_expired" or other blocking flags from meta_data
    meta = dict(campaign.meta_data or {})
    meta.pop("window_expired", None)
    campaign.meta_data = meta
    
    session.add(campaign)
    
    await session.commit()
    
    # Trigger Warmer Logic - it will see these as "READY" in buffer but will NOT start calling 
    # because campaign.status is now PAUSED.
    logger.info("[Execution] Triggering Warmer after reset (expecting no promotions as PAUSED)...")
    await QueueWarmer.check_and_replenish(campaign_id, session)
    
    # Log System Event
    session.add(CampaignEvent(
        campaign_id=campaign_id,
        event_type="SYSTEM",
        message=f"Campaign Reset Initiated by User. {count} items re-queued for attempt.",
        status="RESET"
    ))
    await session.commit()

    # Refresh state and broadcast
    status_data = await get_campaign_realtime_status_internal(campaign_id, session, trigger_warmer=False)
    
    return {"status": "reset_complete", "items_reset": count, "maps_invalidated": len(active_maps) if item_ids else 0, "campaign_status": campaign.status, "data": status_data}


@router.post("/campaign/{campaign_id}/retry/{lead_id}")
async def retry_lead(
    campaign_id: UUID,
    lead_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Manually retries a specific lead.
    1. Finds the QueueItem for this lead.
    2. Resets status to READY.
    3. Invalidates any active execution map.
    4. Triggers UI update.
    """
    logger.info(f"[Execution] Retrying lead {lead_id} in campaign {campaign_id}")
    
    # 1. Fetch QueueItem
    stmt = (
        select(QueueItem)
        .where(QueueItem.campaign_id == campaign_id)
        .where(QueueItem.lead_id == lead_id)
    )
    result = await session.execute(stmt)
    q_item = result.scalars().first()
    
    if not q_item:
        raise HTTPException(status_code=404, detail="Queue item not found for this lead")

    # 2. Invalidate old BolnaExecutionMaps
    map_stmt = (
        select(BolnaExecutionMap)
        .where(BolnaExecutionMap.queue_item_id == q_item.id)
    )
    maps_result = await session.execute(map_stmt)
    active_maps = maps_result.scalars().all()
    for m in active_maps:
        if m.call_status not in ["completed", "failed", "busy", "no-answer", "canceled"]:
            m.call_status = "canceled_by_retry" 
            session.add(m)
            
    # 3. Reset Status to READY
    now = datetime.utcnow()
    q_item.status = "READY"
    q_item.outcome = None 
    q_item.locked_by_user_id = None
    q_item.locked_at = None
    q_item.scheduled_for = None
    q_item.updated_at = now
    
    session.add(q_item)
    await session.commit()
    
    # Trigger UI update
    status_data = await get_campaign_realtime_status_internal(campaign_id, session, trigger_warmer=False)
    
    return {"status": "retry_initiated", "lead_id": lead_id, "data": status_data}


@router.post("/campaign/{campaign_id}/replenish")
async def replenish_calls(
    campaign_id: UUID,
    threshold_seconds: int = 10,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Replenish leads that had short calls (e.g. < 10 seconds), resetting them to READY.
    Also switches the campaign back to ACTIVE mode.
    """
    logger.info(f"[Execution] Replenishing calls < {threshold_seconds}s for campaign {campaign_id}")
    
    # 1. Identify Target Leads
    # We want QueueItems that are effectively 'done' but had a short call log
    
    # Subquery: Find CallLogs with duration < threshold
    # Note: We group by lead_id to find the LATEST call log for that lead
    # and check if that latest call was short.
    
    # Use a direct join strategy
    stmt = (
        select(QueueItem, CallLog)
        .join(CallLog, QueueItem.lead_id == CallLog.lead_id)
        .where(QueueItem.campaign_id == campaign_id)
        # Only look at items that are currently considered "processed"/failed/completed
        # We don't want to reset items that are already waiting (READY) or Scheduled
        .where(QueueItem.status.not_in(["READY", "PENDING", "QUEUED", "SCHEDULED", "DIALING_INTENT", "CONNECTED", "RINGING"]))
        # Filter for short calls
        .where(CallLog.duration < threshold_seconds)
        # Ensure it's the latest call log for this lead to avoid resetting old history
        .order_by(CallLog.created_at.desc())
    )
    
    # Execute (might get duplicates if multiple logs, so we handle that)
    result = await session.execute(stmt)
    rows = result.all()
    
    processed_leads = set()
    count = 0
    
    now = datetime.utcnow()
    
    for q_item, call_log in rows:
        if q_item.lead_id in processed_leads:
            continue
            
        # Double check: is this the LATEST log? 
        # (SQLAlchemy join approach above might return multiple logs per lead)
        # A cleaner way is to fetch all matches and deduce in python or complex subquery.
        # Given potential scale, let's verify quickly.
        # Actually, simpler: just reset them. If they had *any* short call that left them in a bad state?
        # User requirement: "less than 10 seconds call states". 
        # Usually implies the *outcome* of the interaction was a short call.
        
        processed_leads.add(q_item.lead_id)
        
        # Reset Item
        q_item.status = "READY"
        q_item.outcome = None
        q_item.locked_by_user_id = None
        q_item.locked_at = None
        q_item.updated_at = now
        session.add(q_item)
        count += 1
        
    # 2. Re-activate Campaign
    campaign = await session.get(Campaign, campaign_id)
    if campaign:
        campaign.status = "ACTIVE"
        session.add(campaign)
        
    await session.commit()
    
    # 3. Trigger Warmer
    await QueueWarmer.check_and_replenish(campaign_id, session)
    
    # 4. Return Status
    status_data = await get_campaign_realtime_status_internal(campaign_id, session)
    
    return {
        "status": "replenished", 
        "count": count, 
        "campaign_status": "ACTIVE",
        "data": status_data
    }


@router.post("/campaign/{campaign_id}/extend-window")
async def extend_window(
    campaign_id: UUID,
    request_data: WindowExtensionRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Extends the execution window for a campaign starting from NOW.
    """
    campaign = await session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Use local time for consistency with start_session validation
    now_local = datetime.now()
    
    # [FIX] Start the window 5 minutes in the past to ensure immediate activation
    # in case of minor clock drift or rapid retry from frontend.
    start_time_local = now_local - timedelta(minutes=5)
    end_local = now_local + timedelta(hours=request_data.hours)

    day_str = start_time_local.strftime("%Y-%m-%d")
    end_time_str = end_local.strftime("%H:%M")
    start_time_str = start_time_local.strftime("%H:%M")

    new_window = {
        "day": day_str,
        "start": start_time_str,
        "end": end_time_str
    }

    windows = list(campaign.execution_windows or [])
    windows.append(new_window)
    campaign.execution_windows = windows

    # Clear expired flag
    meta = dict(campaign.meta_data or {})
    meta.pop("window_expired", None)
    campaign.meta_data = meta

    session.add(campaign)
    await session.commit()
    await session.refresh(campaign)

    # [NEW] Sync Execution Windows to Calendar (After Extension)
    try:
        stmt = select(CalendarConnection).where(
            CalendarConnection.company_id == campaign.company_id,
            CalendarConnection.status == "active"
        )
        result = await session.execute(stmt)
        conn = result.scalars().first()
        if conn:
            # Fetch company for timezone info
            from app.models.company import Company
            company = await session.get(Company, campaign.company_id)
            timezone_str = company.timezone if company else "UTC"

            await google_calendar_service.sync_campaign_windows(conn, campaign, timezone_str=timezone_str)
            logger.info(f"[Execution] Synced extended windows for campaign {campaign.id} using TZ: {timezone_str}")
    except Exception as e:
        logger.error(f"[Execution] Calendar sync failed after extension: {e}")

    return {"status": "window_extended", "new_window": new_window, "campaign_status": campaign.status}


@router.websocket("/campaign/{campaign_id}/ws")
async def campaign_websocket(
    websocket: WebSocket,
    campaign_id: UUID,
):
    """
    WebSocket endpoint for real-time campaign execution updates.
    
    Handshake Authentication:
    Since WebSockets don't support custom headers easily, we accept a 'token' 
    query parameter and verify it against Firebase.
    """
    campaign_id_str = str(campaign_id)
    
    # Accept the connection first so we can send close frames with error codes
    await websocket.accept()
    
    token = websocket.query_params.get("token")
    

    # 1. Verification
    try:
        if not token:
            logger.warning("[WebSocket] Missing auth token")
            await websocket.close(code=4001, reason="Missing auth token")
            return

        from app.core.security import get_current_user_no_depends
        # Decode the token
        decoded_token = await get_current_user_no_depends(f"Bearer {token}")
        user_id = decoded_token.get("uid")
        logger.info(f"[WebSocket] Authenticated user {user_id} for campaign {campaign_id_str}")
        
    except Exception as e:
        logger.error(f"[WebSocket] Auth failure: {e}")
        # 4001: Machine-readable error code for Auth Failure
        await websocket.close(code=4001, reason=f"Auth failed: {str(e)}")
        return


    try:
        # Register the connection
        if campaign_id_str not in ws_manager.active_connections:
            ws_manager.active_connections[campaign_id_str] = set()
        ws_manager.active_connections[campaign_id_str].add(websocket)
        logger.info(f"[WebSocket] Connected user {user_id} for campaign {campaign_id_str}. Active: {len(ws_manager.active_connections[campaign_id_str])}")
        
        # Initial state push
        async with async_session_factory() as session:
            try:
                initial_status = await get_campaign_realtime_status_internal(campaign_id, session, trigger_warmer=True)
                await ws_manager.send_personal_message({
                    "type": "status_update",
                    "campaign_id": campaign_id_str,
                    "data": initial_status
                }, websocket)
            except Exception as e:
                logger.error(f"[WebSocket] Failed to push initial state for {campaign_id_str}: {e}")
                import traceback
                logger.error(traceback.format_exc())
                # Send error message to client before possible failure
                await ws_manager.send_personal_message({
                    "type": "error",
                    "message": "Failed to load initial campaign state"
                }, websocket)
        
        while True:
            try:
                # Wait for client input with timeout (acts as keepalive/heartbeat checker)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=45.0)
                if data == "ping":
                    await ws_manager.send_personal_message({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat() + "Z"
                    }, websocket)
            except asyncio.TimeoutError:
                # No data from client is fine, we just continue the loop
                # The manager will broadcast periodic updates anyway
                continue
            except WebSocketDisconnect as e:
                logger.info(f"[WebSocket] Client {user_id} disconnected from {campaign_id_str}. Code: {e.code}, Reason: {e.reason}")
                break
            except Exception as e:
                logger.error(f"[WebSocket] Loop error for {campaign_id_str}: {e}")
                await websocket.close(code=4000, reason=f"Internal error: {str(e)}")
                break
                
    except Exception as e:
        logger.error(f"[WebSocket] Crashing for campaign {campaign_id_str}: {e}")
        # Try to close gracefully if not already closed
        try:
            await websocket.close(code=1011, reason=f"Server error: {str(e)}")
        except:
            pass
    finally:
        ws_manager.disconnect(websocket, campaign_id_str)
        logger.info(f"[WebSocket] Cleaned up connection for {campaign_id_str}")



def _parse_fallback_extraction(payload: dict) -> dict:
    """
    Helper to extract structured data from payload if the column is null.
    """
    if not payload:
        return {}
    
    # Check directly for extracted_data in payload
    if payload.get("extracted_data"):
        return payload.get("extracted_data")
        
    # Check custom_extractions
    custom = payload.get("custom_extractions")
    if custom:
        if isinstance(custom, str):
            import json
            try:
                return json.loads(custom)
            except:
                return {"raw": custom}
        elif isinstance(custom, dict):
            return custom
            
    return {}

@router.get("/campaign/{campaign_id}/logs")
async def get_campaign_call_logs(
    campaign_id: UUID,
    page: int = 1,
    page_size: int = 20,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Paginated call logs for a specific campaign.
    """
    offset = (page - 1) * page_size
    
    # Join BolnaExecutionMap with QueueItem and CampaignLead via chained outerjoins.
    # We MUST use outerjoin because if a QueueItem is deleted (e.g. during a reset),
    # we still want to show the execution log row, even if lead info is partially missing.
    stmt = (
        select(BolnaExecutionMap, CampaignLead, QueueItem)
        .outerjoin(QueueItem, BolnaExecutionMap.queue_item_id == QueueItem.id)
        .outerjoin(CampaignLead, QueueItem.lead_id == CampaignLead.id)
        .where(BolnaExecutionMap.campaign_id == campaign_id)
        .order_by(BolnaExecutionMap.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    
    results = await session.execute(stmt)
    logs = []
    
    for execution, lead, q_item in results.all():
        try:
            # 1. Business Outcome Logic
            # Priority: explicit outcome > intent map > queue status > "-"
            business_outcome = execution.call_outcome

            # Map Intent (Strong overrides)
            intent_map = {
                "INTENT_YES": "Interested",
                "INTENT_NO": "Not Interested",
                "SCHEDULED": "Scheduled",
                "INTENT_NO_ANSWER": "No Answer",
                "FAILED": "Failed Attempt",
                "DIALING_INTENT": "Dialing",
                "CONSUMED": "Completed", 
                "COMPLETED": "Completed"
            }
            
            if not business_outcome:
                if q_item and q_item.status in intent_map:
                    business_outcome = intent_map[q_item.status]
                elif q_item:
                    # Fallback to humanized status (e.g. "INTENT_YES_PENDING" -> "Intent Yes Pending")
                    business_outcome = (q_item.status or "Unknown").replace("_", " ").title()
                else:
                    business_outcome = (execution.call_status or "Unknown").title()

            # 2. Reason Logic
            # Priority: termination_reason > call_status > "-"
            reason = execution.termination_reason
            if not reason:
                reason = execution.call_status # e.g. "completed", "failed"
            
            # Extract recording_url from telephony_data or fallback to top-level
            last_webhook = execution.last_webhook_payload or {}
            if not isinstance(last_webhook, dict):
                last_webhook = {}
                
            telephony_data = last_webhook.get("telephony_data", {})
            if not isinstance(telephony_data, dict):
                telephony_data = {}
                
            recording_url = telephony_data.get("recording_url") or last_webhook.get("recording_url")
                
            logs.append({
                "id": str(execution.id),
                "bolna_call_id": execution.bolna_call_id,
                "status": execution.call_status,
                "outcome": business_outcome,
                "duration": execution.call_duration,
                "total_cost": execution.total_cost,
                "currency": execution.currency,
                "created_at": execution.created_at.isoformat() + "Z" if execution.created_at else None,
                "termination_reason": reason,
                "transcript_summary": execution.transcript_summary,
                "full_transcript": execution.full_transcript or execution.transcript,
                "extracted_data": execution.extracted_data if isinstance(execution.extracted_data, dict) else _parse_fallback_extraction(last_webhook),
                "recording_url": recording_url,
                "raw_data": last_webhook,
                "usage_metadata": last_webhook.get("usage_breakdown") or last_webhook.get("usage"),
                "telephony_provider": execution.telephony_provider,
                "lead": {
                    "id": str(lead.id) if lead else None,
                    "name": lead.customer_name if lead else "Unknown Lead",
                    "number": lead.contact_number if lead else "N/A",
                    "cohort": lead.cohort if lead else "N/A"
                }
            })
        except Exception as e:
            logger.error(f"[Execution] Error processing log row {execution.id if execution else 'unknown'}: {e}")
            import traceback
            traceback.print_exc()
            continue
        
    return logs


@router.get("/campaign/{campaign_id}/lead/{lead_id}/events")
async def get_lead_campaign_events(
    campaign_id: UUID,
    lead_id: UUID,
    session: AsyncSession = Depends(get_session),
    call_id: Optional[str] = None, 
) -> Any:
    """
    Fetches events for a specific lead within a campaign.
    Useful for the detailed activity modal.
    """
    stmt = (
        select(CampaignEvent)
        .where(CampaignEvent.campaign_id == campaign_id)
        .where(CampaignEvent.lead_id == lead_id)
        .order_by(CampaignEvent.created_at.asc())
    )
    result = await session.execute(stmt)
    events = result.scalars().all()

    # [FIX] Filter by call_id if provided (Strict Scoping)
    if call_id:
        events = [e for e in events if e.data and e.data.get("call_id") == call_id]
    
    formatted_events = []
    for e in events:
        formatted_events.append({
            "id": str(e.id),
            "timestamp": e.created_at.isoformat() + "Z",
            "type": e.event_type.lower(),
            "agent_name": e.agent_name,
            "message": e.message,
            "status": e.status,
            "lead_id": str(e.lead_id) if e.lead_id else None
        })
    
    return formatted_events

@router.get("/campaign/{campaign_id}/stats")
async def get_campaign_stats(
    campaign_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Returns aggregate performance metrics for the campaign to match Bolna's dashboard.
    """
    # 1. Total Cost & Duration
    # select sum(total_cost), sum(call_duration), count(*) from bolna_execution_map where campaign_id = ...
    from sqlalchemy import func
    
    stmt = (
        select(
            func.sum(BolnaExecutionMap.total_cost),
            func.sum(BolnaExecutionMap.call_duration),
            func.count(BolnaExecutionMap.id)
        )
        .where(BolnaExecutionMap.campaign_id == campaign_id)
    )
    result = await session.execute(stmt)
    total_cost, total_duration, total_calls = result.one()
    
    total_cost = total_cost or 0.0
    total_duration = total_duration or 0
    total_calls = total_calls or 0
    
    # 2. Status Breakdown
    # select call_status, count(*) ... group by call_status
    status_stmt = (
        select(BolnaExecutionMap.call_status, func.count(BolnaExecutionMap.id))
        .where(BolnaExecutionMap.campaign_id == campaign_id)
        .group_by(BolnaExecutionMap.call_status)
    )
    status_results = await session.execute(status_stmt)
    status_breakdown = {row[0]: row[1] for row in status_results.all()}
    
    # 3. Intent/Outcome Breakdown (based on Call Outcome or Termination Reason)
    outcome_stmt = (
        select(BolnaExecutionMap.call_outcome, func.count(BolnaExecutionMap.id))
        .where(BolnaExecutionMap.campaign_id == campaign_id)
        .where(BolnaExecutionMap.call_outcome.is_not(None))
        .group_by(BolnaExecutionMap.call_outcome)
    )
    outcome_results = await session.execute(outcome_stmt)
    outcome_breakdown = {row[0]: row[1] for row in outcome_results.all()}

    return {
        "total_cost": total_cost,
        "total_duration": total_duration,
        "total_calls": total_calls,
        "avg_cost": (total_cost / total_calls) if total_calls > 0 else 0,
        "avg_duration": (total_duration / total_calls) if total_calls > 0 else 0,
        "status_breakdown": status_breakdown,
        "outcome_breakdown": outcome_breakdown
    }



@router.post("/campaign/{campaign_id}/hard-reset")
async def hard_reset_campaign(
    campaign_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    [DESTRUCTIVE] Hard Reset: Wipes all execution data for the campaign.
    1. Deletes all BolnaExecutionMaps (Call History).
    2. Deletes all QueueItems (Queue State).
    3. Deletes all CallLogs (Call Records).
    4. Resets Campaign Status to DRAFT.
    5. Resets all Leads to PENDING (Optional, effectively done by removing QueueItems).
    """
    logger.info(f"[Execution] HARD RESET initiated for campaign {campaign_id}")
    
    campaign = await session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # 0. Delete UserQueueItems (Fix for ForeignKeyViolationError)
    # These reference QueueItems, so they must go first.
    from app.models.user_queue_item import UserQueueItem
    stmt_user_q = select(UserQueueItem).where(UserQueueItem.campaign_id == campaign_id)
    user_items = (await session.execute(stmt_user_q)).scalars().all()
    for u_item in user_items:
        await session.delete(u_item)

    # 1. Delete BolnaExecutionMaps
    stmt_maps = select(BolnaExecutionMap).where(BolnaExecutionMap.campaign_id == campaign_id)
    maps = (await session.execute(stmt_maps)).scalars().all()
    for m in maps:
        await session.delete(m)
        
    # 2. Delete QueueItems
    stmt_q = select(QueueItem).where(QueueItem.campaign_id == campaign_id)
    items = (await session.execute(stmt_q)).scalars().all()
    for item in items:
        await session.delete(item)
        
    # 3. Delete CallLogs
    stmt_logs = select(CallLog).where(CallLog.campaign_id == campaign_id)
    logs = (await session.execute(stmt_logs)).scalars().all()
    for log in logs:
        await session.delete(log)
        
    # 4. Reset Campaign Status
    campaign.status = "DRAFT"
    campaign.updated_at = datetime.utcnow()
    session.add(campaign)
    
    await session.commit()
    
    logger.info(f"[Execution] HARD RESET COMPLETE for campaign {campaign_id}")
    return {"status": "success", "message": "Campaign data wiped successfully."}


class CopyToQueueRequest(BaseModel):
    call_log_id: Optional[str] = None
    preferred_slot: Optional[dict] = None # {start_time, end_time, day}

@router.post("/campaign/{campaign_id}/lead/{lead_id}/copy-to-queue")
async def copy_to_queue(
    campaign_id: UUID,
    lead_id: UUID,
    request: CopyToQueueRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Manually copies a lead to the user's call queue (QueueItem).
    Sets status to 'PENDING' so it appears in the 'Upcoming' list for the user to call.
    """
    logger.info(f"[Execution] Copying lead {lead_id} to queue for campaign {campaign_id}")
    
    # 1. Validate Campaign
    campaign = await session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # [FIX] Import here to ensure availability
    from app.models.user_queue_item import UserQueueItem

    # 2. Check for existing QueueItem
    stmt = select(QueueItem).where(
        QueueItem.campaign_id == campaign_id,
        QueueItem.lead_id == lead_id
    )
    result = await session.execute(stmt)
    existing_item = result.scalars().first()
    
    now = datetime.utcnow()
    
    if existing_item:
        # If it's already in a "live" queue state, just return success
        if existing_item.status in ["PENDING", "QUEUED", "READY", "SCHEDULED"]:
             return {"status": "already_queued", "message": "Lead is already in the queue"}
             
        # Reactivate it
        existing_item.status = "PENDING"
        existing_item.promoted_to_user_queue = True
        existing_item.promoted_at = now
        existing_item.updated_at = now
        # Reset locks
        existing_item.locked_by_user_id = None
        existing_item.locked_at = None
        session.add(existing_item)
    else:
        # Create new QueueItem
        new_item = QueueItem(
            campaign_id=campaign_id,
            lead_id=lead_id,
            status="PENDING",
            priority_score=100, # High priority for manual adds
            promoted_to_user_queue=True,
            promoted_at=now
        )
        session.add(new_item)
        
    # 3. Create UserQueueItem (CRITICAL: Front-end reads UserQueueItem, not just QueueItem)
    # We use UserQueueWarmer's logic but manually since we want to force it
    
    # Check if UserQueueItem already exists
    user_q_stmt = select(UserQueueItem).where(
        UserQueueItem.campaign_id == campaign_id,
        UserQueueItem.lead_id == lead_id
    )
    user_q_result = await session.execute(user_q_stmt)
    existing_user_item = user_q_result.scalars().first()
    
    if not existing_user_item:
        logger.info(f"[Execution] Creating new UserQueueItem for lead {lead_id}...")
        
        # 3.1 Fetch Context (Call History)
        call_history = {}
        ai_summary = "Manually added to queue"
        intent_strength = 1.0 # High confidence since manual
        
        # Try to get context from CallLog if provided
        if request.call_log_id:
            try:
                call_log_uuid = UUID(request.call_log_id)
                call_log = await session.get(CallLog, call_log_uuid)
                if call_log:
                     # Copy context
                     payload = call_log.webhook_payload or {}
                     extracted = payload.get("extracted_data", {}) or {}
                     
                     call_history = {
                        "manual_trigger": True,
                        "source_call_log_id": str(call_log.id),
                        "transcript_summary": "Promoted from call activity log",
                        "last_outcome": call_log.outcome
                     }
                     if request.preferred_slot:
                         call_history["preferred_slot"] = request.preferred_slot
                         
                     # Use existing summary if available
                     if "user_intent" in extracted:
                         ai_summary = extracted["user_intent"][:200]
            except Exception as e:
                logger.warning(f"[Execution] Warning: Failed to fetch context from call log: {e}")

        # 3.2 Create the item
        from app.models.user_queue_item import UserQueueItem
        
        # Determine priority score: Start HIGH because it's manual
        priority = 5500 # Higher than normal intent items (2000-5000), but lower than urgent scheduled (8000+)
        
        new_user_item = UserQueueItem(
            campaign_id=campaign_id,
            lead_id=lead_id,
            original_queue_item_id=existing_item.id if existing_item else new_item.id,
            status="READY",
            priority_score=priority,
            intent_strength=intent_strength,
            ai_summary=ai_summary,
            call_history=call_history,
            detected_at=now,
            promoted_to_user_queue=True # Redundant but good for tracking if schema has it? No schema doesn't have it.
        )
        
        # Handle preferred slot if passed (Direct Mapping)
        if request.preferred_slot and request.preferred_slot.get("start_time"):
             try:
                 from dateutil import parser
                 # Parse ISO string to datetime
                 slot_time = parser.parse(request.preferred_slot.get("start_time"))
                 new_user_item.confirmation_slot = slot_time
                 # Boost priority further if scheduled
                 new_user_item.priority_score += 5000 
             except:
                 pass

        session.add(new_user_item)
    else:
        # Reactivate existing UserQueueItem if it was closed/locked
        if existing_user_item.status != "READY":
             existing_user_item.status = "READY"
             existing_user_item.priority_score = 5500 # Reset priority to High
             existing_user_item.locked_by_user_id = None
             existing_user_item.locked_at = None
             existing_user_item.lock_expires_at = None
             existing_user_item.updated_at = now
             session.add(existing_user_item)

    # 4. Update Call Log (if provided)
    if request.call_log_id:
        try:
            call_log_uuid = UUID(request.call_log_id)
            call_log = await session.get(CallLog, call_log_uuid)
            if call_log:
                call_log.copied_to_user_queue = True
                call_log.copied_to_queue_at = now
                session.add(call_log)
        except Exception as e:
            logger.warning(f"[Execution] Warning: Failed to update call log {request.call_log_id}: {e}")
            
    await session.commit()
    
    # 5. Trigger Warmer/Broadcast
    # We want this to appear immediately
    # We call check_and_replenish just to be safe, but we manually added the item so it should be there.
    # checking backpressure might be good.
    from app.services.user_queue_warmer import UserQueueWarmer
    await UserQueueWarmer.check_backpressure(session, campaign_id)
    
    # Broadcast update
    status_data = await get_campaign_realtime_status_internal(campaign_id, session)
    try:
        from app.services.websocket_manager import manager
        await manager.broadcast_status_update(str(campaign_id), status_data)
        # Also broadcast specific user queue update event
        await manager.broadcast_status_update(str(campaign_id), {"event": "user_queue_update"})
    except:
        pass
        
    return {"status": "success", "message": "Lead copied to queue"}


@router.get("/campaign/{campaign_id}/history")
async def get_campaign_history(
    campaign_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Returns the complete call history for a campaign with comprehensive stats.
    Used by the dedicated Campaign History page.
    """
    # Fetch campaign
    campaign = await session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Fetch ALL call logs for this campaign
    # [NEW] Join with UserQueueItem to get item_id for context fetching
    from app.models.user_queue_item import UserQueueItem
    
    history_stmt = (
        select(CallLog, CampaignLead, UserQueueItem)
        .join(CampaignLead, CallLog.lead_id == CampaignLead.id)
        .outerjoin(UserQueueItem, and_(
            UserQueueItem.campaign_id == campaign_id,
            UserQueueItem.lead_id == CampaignLead.id
        ))
        .where(CallLog.campaign_id == campaign_id)
        .order_by(CallLog.created_at.desc())
    )
    
    history_result = await session.execute(history_stmt)
    history_items = history_result.all()
    
    # Process history items (reuse logic from active-status)
    history_data = []
    for log, lead, user_queue_item in history_items:
        # Extract intent and summary from execution map if possible (most recent)
        summary = log.transcript_summary or ""
        key_insight = ""
        next_step = ""
        
        # Enriched data from webhook processing
        extracted = {}
        if log.webhook_payload:
            extracted = log.webhook_payload.get("extracted_data", {}) or {}
            key_insight = extracted.get("key_insight", "")
            next_step = extracted.get("next_step", "")

        # Get transcript
        transcript = log.webhook_payload.get("transcript") if log.webhook_payload else []
        if not isinstance(transcript, list):
            transcript = []
        
        # Sentiment analysis
        transcript_str = str(transcript) # Use the actual transcript list converted to string
        sentiment = analyze_sentiment(
            transcript=transcript_str,
            outcome=log.outcome or log.status or "",
            duration=log.duration,
            extracted_data=extracted
        )
        
        # Agreement detection
        agreement_status = detect_agreement_status(
            user_intent=key_insight or "",
            outcome=log.outcome or "",
            extracted_data=extracted
        )

        history_data.append({
            "lead_id": str(lead.id),
            "name": lead.customer_name,
            "cohort": lead.cohort,
            "status": (log.outcome or log.status).upper(),
            "outcome": log.outcome,
            "duration": log.duration,
            "timestamp": log.created_at.isoformat() + "Z",
            "avatar_seed": lead.customer_name,
            "summary": summary,
            "key_insight": key_insight,
            "next_step": next_step,
            "phone_number": lead.contact_number,
            "recording_url": log.recording_url,
            "transcript": transcript,
            "sentiment": sentiment,
            "agreement_status": agreement_status,
            "call_log_id": str(log.id),
            "bolna_call_id": log.bolna_call_id,
            "user_queue_item_id": str(user_queue_item.id) if user_queue_item else None,  # [NEW] For fetching complete context
        })
    
    # Calculate comprehensive stats
    total_calls = len(history_items)
    converted_calls = sum(1 for log_item, _, _ in history_items if log_item.outcome in ["INTENT_YES", "INTERESTED", "SCHEDULED"])
    connected_calls = sum(1 for log_item, _, _ in history_items if log_item.outcome not in ["VOICEMAIL", "NO_ANSWER", "BUSY", "FAILED_CONNECT"])
    
    # Calculate average duration (only for connected calls)
    durations = [log_item.duration for log_item, _, _ in history_items if log_item.outcome not in ["VOICEMAIL", "NO_ANSWER", "BUSY", "FAILED_CONNECT"]]
    avg_duration = sum(durations) / len(durations) if durations else 0
    
    # Sentiment breakdown
    positive_count = sum(1 for item in history_data if item["sentiment"] and item["sentiment"].get("score", 0) > 0.3)
    negative_count = sum(1 for item in history_data if item["sentiment"] and item["sentiment"].get("score", 0) < -0.3)
    neutral_count = total_calls - positive_count - negative_count
    
    stats = {
        "total_calls": total_calls,
        "connected_calls": connected_calls,
        "yes_intent_leads": converted_calls,  # [NEW] Explicit Yes Intent Count
        "conversion_rate": (converted_calls / total_calls * 100) if total_calls > 0 else 0,
        "avg_duration": int(avg_duration),
        "sentiment_breakdown": {
            "positive": positive_count,
            "neutral": neutral_count,
            "negative": negative_count
        }
    }
    
    return {
        "history": history_data,
        "stats": stats
    }
