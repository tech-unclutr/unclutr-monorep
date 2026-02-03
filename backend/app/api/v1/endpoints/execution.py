from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, or_, and_
from datetime import datetime, timedelta

from app.api.deps import get_session, get_current_active_user
from app.models.user import User
from app.models.campaign import Campaign
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from app.services.queue_warmer import QueueWarmer
from app.services.intelligence.google_calendar_service import google_calendar_service
from app.models.calendar_connection import CalendarConnection
from pydantic import BaseModel
from app.services.websocket_manager import manager as ws_manager
from app.core.db import async_session_factory

router = APIRouter()

from app.models.bolna_execution_map import BolnaExecutionMap

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
    return await get_campaign_realtime_status_internal(campaign_id, session)


async def get_campaign_realtime_status_internal(campaign_id: UUID, session: AsyncSession, trigger_warmer: bool = True) -> dict:
    """
    Core logic for calculating the real-time engagement dashboard.
    Shared between periodic polling and WebSocket broadcasts.
    """
    # 0. Fetch Campaign
    campaign = await session.get(Campaign, campaign_id)
    if not campaign:
        return {}
        
    # [NEW] Trigger Warmer/Replenish at the VERY START to ensure all subsequent queries see the new state
    # This ensures "DIALING_INTENT" leads added by the warmer appear in the 'agents' list immediately.
    if trigger_warmer and campaign.status not in ["COMPLETED", "DRAFT"]:
        await QueueWarmer.check_and_replenish(campaign_id, session)
        # Refresh campaign object as warmer might have updated its status (e.g. to PAUSED)
        await session.refresh(campaign)

    config = campaign.execution_config or {}
    MAX_CONCURRENCY = config.get("max_concurrent_calls", 2) # Default to 2
    
    # 2. Query Active Execution Maps
    # We query QueueItems that are either marked for dialing OR have an active call record
    # Note: We join BolnaExecutionMap loosely, then filter in the WHERE clause
    # IMPORTANT: Filter out stale entries based on timeout thresholds
    
    initiated_cutoff = datetime.utcnow() - timedelta(minutes=INITIATED_TIMEOUT_MINUTES)
    active_cutoff = datetime.utcnow() - timedelta(minutes=ACTIVE_CALL_TIMEOUT_MINUTES)
    
    statement = (
        select(QueueItem, CampaignLead, BolnaExecutionMap)
        .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
        .outerjoin(BolnaExecutionMap, QueueItem.id == BolnaExecutionMap.queue_item_id)
        .where(QueueItem.campaign_id == campaign_id)
        .where(
            or_(
                # Case 1: DIALING_INTENT - ALWAYS include these as active agents
                # This ensures we don't prematurely mark a campaign as complete
                # while leads are still in the process of being dialed or retried.
                QueueItem.status == "DIALING_INTENT",
                # Case 2: Active execution map with recent activity
                and_(
                    BolnaExecutionMap.call_status.in_(["initiated", "ringing", "connected", "speaking", "listening", "processing"]),
                    or_(
                        # Initiated calls must be recent (< 5 min)
                        and_(
                            BolnaExecutionMap.call_status == "initiated",
                            BolnaExecutionMap.updated_at > initiated_cutoff
                        ),
                        # Active calls must be recent (< 30 min)
                        and_(
                            BolnaExecutionMap.call_status.in_(["ringing", "connected", "speaking", "listening", "processing"]),
                            BolnaExecutionMap.updated_at > active_cutoff
                        )
                    )
                )
            )
        )
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
        "Alex Rivera", "Sarah Chen", "Rohan Gupta", "Maya Williams", 
        "Jordan Vance", "Priya Sharma", "Vikram Malhotra", "Tara Knight",
        "Leo Zhang", "Elena Rossi", "Marcus Thorne", "Skylar Page"
    ]
    
    for i, (q_item, lead, exec_map) in enumerate(unique_items.values()):
        # Assign a name based on the ID or index for consistency during a session
        name_idx = (hash(str(lead.id)) % len(NAMES))
        agent_name = NAMES[name_idx]
        
        # Determine status
        if exec_map:
            # Normalize to lowercase and map in-progress -> connected
            status = (exec_map.call_status or "initiated").lower()
            if status == "in-progress":
                status = "connected"
            
            duration = exec_map.call_duration
            agent_id = exec_map.bolna_agent_id or str(exec_map.id)
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
        .where(QueueItem.status.in_(["PENDING", "QUEUED", "READY"]))
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
        if str(lead.id) in seen_leads:
            continue
        
        seen_leads.add(str(lead.id))
        upcoming_data.append({
            "lead_id": lead.id,
            "name": lead.customer_name,
            "cohort": lead.cohort,
            "avatar_seed": lead.id,
            "status": q_item.status # Optional debug info
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
            upcoming_data.append({
                "lead_id": lead.id,
                "name": lead.customer_name,
                "cohort": lead.cohort,
                "avatar_seed": lead.id,
                "status": "BACKLOG"
            })

    # 4. Fetch Recent History (Completed/Failed) for "Left side" of the queue
    # We want valid queue items that are NOT in active states and NOT in READY state
    # i.e. COMPLETED, FAILED, CONSUMED
    history_stmt = (
        select(QueueItem, CampaignLead, BolnaExecutionMap)
        .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
        .outerjoin(BolnaExecutionMap, QueueItem.id == BolnaExecutionMap.queue_item_id)
        .where(QueueItem.campaign_id == campaign_id)
        .where(QueueItem.status.in_(["COMPLETED", "FAILED", "CONSUMED", "INTENT_YES", "INTENT_NO", "INTENT_NO_ANSWER"]))
        .order_by(QueueItem.updated_at.desc())
        .limit(10)
    )
    
    history_result = await session.execute(history_stmt)
    history_items = history_result.all()
    
    history_data = []
    seen_history_leads = set()
    for q_item, lead, exec_map in history_items:
        lead_id_str = str(lead.id)
        if lead_id_str in seen_history_leads:
            continue
        seen_history_leads.add(lead_id_str)
        
        history_data.append({
            "lead_id": lead.id,
            "name": lead.customer_name,
            "status": q_item.status,
            "outcome": q_item.outcome, 
            "duration": exec_map.call_duration if exec_map else 0,
            "avatar_seed": lead.id
        })

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
        "FAILED": 3,
        "INTENT_NO": 2,
        "BACKLOG": 1
    }
    
    for lead, q_item in all_leads_raw:
        cohort = lead.cohort or "Unassigned"
        lead_id = str(lead.id)
        current_status = q_item.status if q_item else "BACKLOG"
        current_outcome = q_item.outcome if q_item else None
        
        # If we've seen this lead before, check if we should update it
        if lead_id in seen_leads_by_cohort:
            existing = seen_leads_by_cohort[lead_id]
            existing_priority = status_priority.get(existing["status"], 0)
            current_priority = status_priority.get(current_status, 0)
            
            # Only update if the new status has higher priority
            if current_priority > existing_priority:
                # Remove old entry from cohort list
                old_cohort = existing["cohort"]
                if old_cohort in leads_by_cohort:
                    leads_by_cohort[old_cohort] = [
                        item for item in leads_by_cohort[old_cohort] 
                        if str(item["lead_id"]) != lead_id
                    ]
                
                # Update tracking
                seen_leads_by_cohort[lead_id] = {
                    "cohort": cohort,
                    "status": current_status,
                    "outcome": current_outcome
                }
                
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
        seen_leads_by_cohort[lead_id] = {
            "cohort": cohort,
            "status": current_status,
            "outcome": current_outcome
        }
        
        if cohort not in leads_by_cohort:
            leads_by_cohort[cohort] = []
            
        leads_by_cohort[cohort].append({
            "lead_id": lead.id,
            "name": lead.customer_name,
            "status": current_status,
            "outcome": current_outcome,
            "avatar_seed": lead.id
        })


    # 7. Calculate Campaign Completion Status
    is_completed = False
    completion_data = {
        "total_targets": 0,
        "total_completed": 0,
        "completion_rate": 0.0,
        "cohort_progress": {}
    }
    
    # Get cohort data from campaign
    cohort_data = campaign.cohort_data or {}
    
    if cohort_data:
        # Cohort-based completion check
        all_cohorts_complete = True
        total_targets = 0
        total_completed = 0
        
        for cohort_name, cohort_config in cohort_data.items():
            target = cohort_config.get("target", 0)
            total_targets += target
            
            # Count INTENT_YES calls for this cohort
            intent_yes_stmt = (
                select(QueueItem)
                .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
                .where(QueueItem.campaign_id == campaign_id)
                .where(CampaignLead.cohort == cohort_name)
                .where(QueueItem.status == "INTENT_YES")
            )
            intent_yes_result = await session.execute(intent_yes_stmt)
            completed_count = len(intent_yes_result.scalars().all())
            total_completed += completed_count
            
            is_cohort_complete = completed_count >= target
            if not is_cohort_complete:
                all_cohorts_complete = False
            
            completion_data["cohort_progress"][cohort_name] = {
                "target": target,
                "completed": completed_count,
                "is_complete": is_cohort_complete
            }
        
        completion_data["total_targets"] = total_targets
        completion_data["total_completed"] = total_completed
        completion_data["completion_rate"] = (total_completed / total_targets * 100) if total_targets > 0 else 0
        
        # Check if all cohorts met their targets
        if all_cohorts_complete and total_targets > 0:
            is_completed = True
    
    # Lead-based completion check (fallback or additional condition)
    # Check if all leads have been exhausted (excluding those that need retry/reset)
    if not is_completed:
        # Check for leads that are currently ready to be called or in the backlog
        # We EXCLUDE FAILED leads from this check because they require a manual RESET to be tried again.
        # This prevents the "Agents Standing By" stalemate when only failures remain.
        
        ready_to_call_stmt = (
            select(QueueItem)
            .where(QueueItem.campaign_id == campaign_id)
            .where(QueueItem.status.in_(["READY", "PENDING", "QUEUED"]))
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
        
        # If no ready leads, no backlog, and no current active agents, mark as complete
        if len(ready_leads) == 0 and len(backlog_leads) == 0 and len(agents) == 0:
            is_completed = True

    # 8. Auto-pause campaign if completed to stop further calling
    # We allow auto-completion from ACTIVE, IN_PROGRESS OR PAUSED states 
    # (if the final lead was a failure that left the campaign in PAUSED/Standby)
    if is_completed and campaign.status in ["ACTIVE", "IN_PROGRESS", "PAUSED"]:
        campaign.status = "COMPLETED"
        session.add(campaign)
        await session.commit()
        await session.refresh(campaign)
        print(f"[Execution] Campaign {campaign_id} auto-completed: Criteria met")

    
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
            "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
            "updated_at": campaign.updated_at.isoformat() if campaign.updated_at else None,
        }
    }
    
    # Broadcast to WebSocket clients (non-blocking)
    try:
        # Import moved to top-level or ensure it's available
        from app.services.websocket_manager import manager
        await manager.broadcast_status_update(str(campaign_id), response_data)
    except Exception as e:
        print(f"[WebSocket] Broadcast error: {e}")
    
    return response_data


async def get_campaign_events_internal(campaign_id: UUID, session: AsyncSession) -> List[dict]:
    """
    Internal logic to fetch recent campaign events.
    """
    # 1. Fetch recent activity from BolnaExecutionMap
    statement = (
        select(BolnaExecutionMap, CampaignLead)
        .join(QueueItem, BolnaExecutionMap.queue_item_id == QueueItem.id)
        .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
        .where(BolnaExecutionMap.campaign_id == campaign_id)
        .order_by(BolnaExecutionMap.updated_at.desc())
        .limit(20)
    )
    result = await session.execute(statement)
    results = result.all()
    
    # [NEW] Check for leads in DIALING_INTENT
    # These should show up as "Initializing" immediately in the UI.
    pending_dialing_stmt = (
        select(QueueItem, CampaignLead)
        .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
        .where(QueueItem.campaign_id == campaign_id)
        .where(QueueItem.status == "DIALING_INTENT")
    )
    pending_dialing = (await session.execute(pending_dialing_stmt)).all()
    
    events = []
    NAMES = [
        "Alex Rivera", "Sarah Chen", "Rohan Gupta", "Maya Williams", 
        "Jordan Vance", "Priya Sharma", "Vikram Malhotra", "Tara Knight",
        "Leo Zhang", "Elena Rossi", "Marcus Thorne", "Skylar Page"
    ]
    
    # Add pending dialing events first
    for q_item, lead in pending_dialing:
        name_idx = (hash(str(lead.id)) % len(NAMES))
        agent_name = NAMES[name_idx]
        events.append({
            "id": f"pending-evt-{q_item.id}",
            "timestamp": q_item.updated_at.isoformat(),
            "type": "agent_action",
            "agent_name": agent_name,
            "message": f"Initializing neural link with {lead.customer_name}...",
            "status": "initiated"
        })

    unique_exec_maps = {}
    for exec_map, lead in results:
        qi_id = str(exec_map.queue_item_id)
        if qi_id not in unique_exec_maps:
            unique_exec_maps[qi_id] = (exec_map, lead)
        else:
            # Keep newest
            existing_map, _ = unique_exec_maps[qi_id]
            if exec_map.updated_at > existing_map.updated_at:
                unique_exec_maps[qi_id] = (exec_map, lead)

    for exec_map, lead in unique_exec_maps.values():
        name_idx = (hash(str(lead.id)) % len(NAMES))
        agent_name = NAMES[name_idx]
        
        # -- DYNAMIC MESSAGE GENERATION --
        msg = None
        payload = exec_map.last_webhook_payload or {}
        
        # 1. Check for real transcript turns (The "Neural Thought" Commentary)
        transcript_data = payload.get('transcript')
        if isinstance(transcript_data, list) and len(transcript_data) > 0:
            last_turn = transcript_data[-1]
            role = last_turn.get('role', 'system')
            content = (last_turn.get('content', '') or last_turn.get('message', '')).strip()
            
            if content:
                # -- NEURAL COMMENTARY ENGINE --
                # Turn raw turns into narrative commentary
                if role == 'agent' or role == 'assistant':
                    # Common agent patterns
                    c = content.lower()
                    if any(x in c for x in ["hello", "hi", "hey"]):
                        msg = f"{agent_name} has initiated contact and is greeting {lead.customer_name}."
                    elif "?" in content:
                        msg = f"{agent_name} is inquiring about {lead.customer_name}'s perspective to gather insights."
                    elif any(x in c for x in ["pricing", "cost", "deal", "discount"]):
                        msg = f"{agent_name} is discussing value and pricing structures with {lead.customer_name}."
                    elif any(x in c for x in ["perfect", "great", "awesome", "understand"]):
                        msg = f"{agent_name} is acknowledging the response and building rapport."
                    else:
                        msg = f"{agent_name} is conveying brand context and guiding the conversation."
                elif role == 'user':
                    msg = f"{lead.customer_name} is responding to {agent_name}'s prompts, providing valuable feedback."
        
        # 2. If no transcript turn, check Extracted Data (The "Decision")
        if not msg and exec_map.extracted_data:
             extracted = exec_map.extracted_data
             if extracted.get('interested'):
                 msg = "Analyzed Intent: POSITIVE. Scheduling follow-up actions."
             elif extracted.get('not_interested'):
                 msg = "Analyzed Intent: NEGATIVE. Gracefully closing conversation."
             elif extracted.get('callback_time'):
                 msg = f"Negotiating Schedule: User requested callback at {extracted.get('callback_time')}"

        # 3. Fallback to Status-based messages (The "Action")
        if not msg:
            # Normalize status for mapping
            normalized_status = (exec_map.call_status or "initiated").lower()
            if normalized_status == "in-progress":
                normalized_status = "connected"

            status_messages = {
                "initiated": f"Initializing neural link with {lead.customer_name}...",
                "ringing": f"Dialing {lead.customer_name}...",
                "connected": f"Connection established with {lead.customer_name}. Engaging neural voice engine.",
                "speaking": f"{agent_name} is actively speaking, conveying brand context to {lead.customer_name}.",
                "listening": f"{agent_name} is listening intently to {lead.customer_name}'s response.",
                "processing": f"Neural processor is analyzing sentiment and drafting a relevant response.",
                "completed": f"Session completed with {lead.customer_name}. Archiving interaction context.",
                "failed": f"Connection failed for {lead.customer_name}. Queuing retry logic."
            }
            msg = status_messages.get(normalized_status, f"Agent {agent_name} executing: {normalized_status}")
        
        # Deduplication Logic (for noise/jitter)
        current_ts = exec_map.updated_at
        is_duplicate_noise = False
        
        for existing_evt in events:
            if existing_evt["message"] == msg:
                if existing_evt["timestamp"] and current_ts:
                    try:
                        existing_dt = datetime.fromisoformat(existing_evt["timestamp"]) if isinstance(existing_evt["timestamp"], str) else existing_evt["timestamp"]
                        if isinstance(existing_dt, datetime) and isinstance(current_ts, datetime):
                             existing_dt = existing_dt.replace(tzinfo=None)
                             current_ts_naive = current_ts.replace(tzinfo=None)
                             diff = abs((existing_dt - current_ts_naive).total_seconds())
                             
                             if diff < 60: # 1 minute window for duplicates
                                 is_duplicate_noise = True
                                 break
                    except Exception:
                        pass
        
        if not is_duplicate_noise:
            events.append({
                "id": str(exec_map.id),
                "timestamp": exec_map.updated_at.isoformat() if exec_map.updated_at else None,
                "type": "agent_action",
                "agent_name": agent_name,
                "message": msg,
                "status": exec_map.call_status
            })
        
    # Add System Keep-Alive if quiet
    if not events:
        campaign = await session.get(Campaign, campaign_id)
        if campaign and campaign.status in ["ACTIVE", "IN_PROGRESS"]:
             events.append({
                 "id": "sys-1",
                 "timestamp": datetime.utcnow().isoformat(),
                 "type": "system",
                 "message": "System: Monitoring active channels. No significant anomalies detected.",
                 "status": "info"
             })
             
    return sorted(events, key=lambda x: x["timestamp"] or "", reverse=True)


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
    campaign = await session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    # Check if strategy is defined (selected_cohorts or cohort_data)
    if not campaign.selected_cohorts and not campaign.cohort_data:
         raise HTTPException(
             status_code=400, 
             detail="Campaign strategy (cohorts/targets) must be defined before starting execution."
         )

    # Validate Execution Window
    if campaign.execution_windows:
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
                    print(f"[Execution] Window parse error for window {w}: {e}")
                    continue
        
        if not is_in_active_window:
            print(f"[Execution] Campaign {campaign_id} start blocked. Time: {now_local}, Windows: {campaign.execution_windows}")
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

    # Enforce Single Active Campaign Rule
    # Pause all other campaigns for this company that are ACTIVE or IN_PROGRESS
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
        for item in items_to_delete:
            await session.delete(item)
            
        print(f"[Execution] Auto-paused campaign {other_camp.id} and cleaned {len(items_to_delete)} queue items.")

    # Update status to ACTIVE
    campaign.status = "ACTIVE"
    campaign.updated_at = datetime.utcnow()
    session.add(campaign)
    await session.commit()
    await session.refresh(campaign)
    
    # Trigger Warmer
    await QueueWarmer.check_and_replenish(campaign_id, session)

    # [NEW] Sync Execution Windows to Calendar
    try:
        stmt = select(CalendarConnection).where(
            CalendarConnection.company_id == campaign.company_id,
            CalendarConnection.status == "active"
        )
        result = await session.execute(stmt)
        conn = result.scalars().first()
        if conn:
            await google_calendar_service.sync_campaign_windows(conn, campaign)
            print(f"[Execution] Synced windows for campaign {campaign.id} to Google Calendar")
    except Exception as e:
        print(f"[Execution] Calendar sync failed: {e}")

    # Broadcast new state
    status_data = await get_campaign_realtime_status_internal(campaign_id, session)
    
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
            await google_calendar_service.sync_campaign_windows(conn, campaign)
            print(f"[Execution] Synced windows for campaign {campaign.id} to Google Calendar")
    except Exception as e:
        print(f"[Execution] Calendar sync failed: {e}")
    
    # Broadcast new state
    status_data = await get_campaign_realtime_status_internal(campaign_id, session)
    
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
async def reset_campaign_progress(
    campaign_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Resets the campaign to start calling fresh for leads that have NOT completed.
    
    PRESERVES:
    - INTENT_YES (Interested)
    - INTENT_NO (Not Interested)
    - SCHEDULED (Pending Callback)
    - CONSUMED (Manual Call)
    
    RESETS (Deletes QueueItem):
    - FAILED
    - INTENT_NO_ANSWER
    - DIALING_INTENT (Stuck)
    - READY
    - ELIGIBLE
    """
    campaign = await session.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    # Define statuses to PRESERVE (Completed or Active Scheduled)
    preserve_statuses = ["INTENT_YES", "INTENT_NO", "SCHEDULED", "CONSUMED", "INTENT_YES_PENDING"]
    
    # Check what we are about to delete (ignoring preserve list)
    statement = (
        select(QueueItem)
        .where(QueueItem.campaign_id == campaign_id)
        .where(QueueItem.status.not_in(preserve_statuses))
    )
    result = await session.execute(statement)
    items_to_reset = result.scalars().all()
    
    count = len(items_to_reset)
    
    # Reset Logic: Update status to READY instead of deleting (avoids FK constraints with history)
    now = datetime.utcnow()
    for item in items_to_reset:
        item.status = "READY"
        item.outcome = None # Clear previous failure reasons
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
    await QueueWarmer.check_and_replenish(campaign_id, session)
    
    # Refresh state and broadcast
    status_data = await get_campaign_realtime_status_internal(campaign_id, session)
    
    return {"status": "reset_complete", "items_reset": count, "campaign_status": campaign.status, "data": status_data}


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
            await google_calendar_service.sync_campaign_windows(conn, campaign)
            print(f"[Execution] Synced extended windows for campaign {campaign.id}")
    except Exception as e:
        print(f"[Execution] Calendar sync failed after extension: {e}")

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
            print("[WebSocket] Missing auth token")
            await websocket.close(code=4001, reason="Missing auth token")
            return

        from app.core.security import get_current_user_no_depends
        # Decode the token
        decoded_token = await get_current_user_no_depends(f"Bearer {token}")
        user_id = decoded_token.get("uid")
        print(f"[WebSocket] Authenticated user {user_id} for campaign {campaign_id_str}")
        
    except Exception as e:
        print(f"[WebSocket] Auth failure: {e}")
        # 4001: Machine-readable error code for Auth Failure
        await websocket.close(code=4001, reason=f"Auth failed: {str(e)}")
        return

    try:
        # Register the connection (websocket is already accepted, so manager won't accept again)
        if campaign_id_str not in ws_manager.active_connections:
            ws_manager.active_connections[campaign_id_str] = set()
        ws_manager.active_connections[campaign_id_str].add(websocket)
        print(f"[WebSocket] Connected for campaign {campaign_id_str}. Total connections: {len(ws_manager.active_connections[campaign_id_str])}")
        
        # Send initial state (Immediate sync so UI doesn't wait for next broadcast)
        async with async_session_factory() as session:
            initial_status = await get_campaign_realtime_status_internal(campaign_id, session)
            await ws_manager.send_personal_message({
                "type": "status_update",
                "campaign_id": campaign_id_str,
                "data": initial_status
            }, websocket)
        
        # Keep the connection alive and listen for client messages
        while True:
            # Wait for any message from client (ping/pong, etc.)
            data = await websocket.receive_text()
            
            # Handle ping/pong for connection health
            if data == "ping":
                await ws_manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }, websocket)
                
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, campaign_id_str)
    except Exception as e:
        print(f"[WebSocket] Error in campaign websocket: {e}")
        ws_manager.disconnect(websocket, campaign_id_str)


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
                business_outcome = q_item.status.replace("_", " ").title()
            else:
                business_outcome = execution.call_status.title()

        # 2. Reason Logic
        # Priority: termination_reason > call_status > "-"
        reason = execution.termination_reason
        if not reason:
            reason = execution.call_status # e.g. "completed", "failed"
            
        logs.append({
            "id": str(execution.id),
            "bolna_call_id": execution.bolna_call_id,
            "status": execution.call_status,
            "outcome": business_outcome,
            "duration": execution.call_duration,
            "total_cost": execution.total_cost,
            "currency": execution.currency,
            "created_at": execution.created_at.isoformat(),
            "termination_reason": reason,
            "transcript_summary": execution.transcript_summary,
            "full_transcript": execution.full_transcript or execution.transcript,
            "extracted_data": execution.extracted_data,
            # Placeholder for recording_url - BolnaExecutionMap doesn't strictly have it but webhook might have sent it.
            # Ideally we join with CallLog if we want persistence or store it in extracted_data/last_webhook_payload
            "recording_url": execution.last_webhook_payload.get("recording_url") if execution.last_webhook_payload else None,
            "usage_metadata": execution.last_webhook_payload.get("usage") if execution.last_webhook_payload else None,
            "telephony_provider": execution.telephony_provider,
            "lead": {
                "id": str(lead.id) if lead else None,
                "name": lead.customer_name if lead else "Unknown Lead",
                "number": lead.contact_number if lead else "N/A",
                "cohort": lead.cohort if lead else "N/A"
            }
        })
        
    return logs


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
