from datetime import datetime
from typing import Any, Optional, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, desc, and_, or_
import logging

from app.api.deps import get_session, get_current_active_user
from app.models.user import User
from app.models.user_queue_item import UserQueueItem
from app.models.user_call_log import UserCallLog
from app.models.campaign_lead import CampaignLead

from app.services.user_queue_warmer import UserQueueWarmer
from app.services.lead_closure import LeadClosure
from app.services.websocket_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/{campaign_id}")
async def get_user_queue(
    campaign_id: UUID,
    status: Optional[str] = Query(None),
    refresh: bool = Query(False),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    session: AsyncSession = Depends(get_session)
) -> Any:
    """Fetch all user queue items for a campaign, sorted by priority."""
    
    
    if refresh:
        logger.debug(f"API received refresh request for {campaign_id}")
        # Trigger manual sweep for missed promotions
        await UserQueueWarmer.poll_missed_promotions(session, campaign_id)
    
    query = select(UserQueueItem, CampaignLead).join(
        CampaignLead, UserQueueItem.lead_id == CampaignLead.id
    ).where(UserQueueItem.campaign_id == campaign_id)
    
    if status:
        query = query.where(UserQueueItem.status == status)
    else:
        # Default to non-closed items
        query = query.where(UserQueueItem.status != "CLOSED")
        
        # [FIX] Filter out items scheduled for the future (RESCHEDULED/SNOOZED)
        # They should only appear when retry_scheduled_for <= now
        now = datetime.utcnow()
        query = query.where(
            or_(
                UserQueueItem.retry_scheduled_for.is_(None),
                UserQueueItem.retry_scheduled_for <= now
            )
        )
        
    # Sort by priority score DESC
    query = query.order_by(desc(UserQueueItem.priority_score), UserQueueItem.detected_at.asc())
    query = query.offset(offset).limit(limit)
    
    

    result = await session.execute(query)
    items = result.all()

    # [FIX] Deduplicate items by lead_id
    # We might have multiple UserQueueItems for the same lead due to race conditions.
    # We want to show the one that is most "active" or "relevant".
    unique_items_map = {}
    
    for item, lead in items:
        # If new lead, add it
        if lead.id not in unique_items_map:
            unique_items_map[lead.id] = (item, lead)
            continue
            
        existing_item, _ = unique_items_map[lead.id]
        
        # Selection Logic:
        # 1. Prefer LOCKED (currently being worked on) over anything else
        if item.status == "LOCKED" and existing_item.status != "LOCKED":
            unique_items_map[lead.id] = (item, lead)
            continue
        elif existing_item.status == "LOCKED":
             continue # Keep existing
             
        # 2. Prefer items with higher priority score
        if item.priority_score > existing_item.priority_score:
             unique_items_map[lead.id] = (item, lead)
             continue
             
        # 3. Fallback: prefer most recently updated
        item_updated_at = item.updated_at or datetime.min
        existing_updated_at = existing_item.updated_at or datetime.min
        if item_updated_at > existing_updated_at:
            unique_items_map[lead.id] = (item, lead)

    # Convert back to list and re-sort to ensure order is preserved/correct
    items = list(unique_items_map.values())
    # Sort by priority score DESC, then detected_at ASC (matching query sort)
    # [SAFETY] Handle None values in sort keys
    items.sort(key=lambda x: (-(x[0].priority_score or 0), x[0].detected_at or datetime.min))
    

    

    formatted_items = []
    for item, lead in items:
        # Extract last AI call time from history if available
        last_ai_call_at = None
        if item.call_history:
            if isinstance(item.call_history, list) and len(item.call_history) > 0:
                # Assuming the last item is the most recent, or we sort? 
                # Usually logs are appended, so last might be latest. 
                # But let's check for 'created_at' in the last item.
                last_ai_call_at = item.call_history[-1].get("created_at")
            elif isinstance(item.call_history, dict):
                last_ai_call_at = item.call_history.get("created_at")
        
        formatted_items.append({
            "id": item.id,
            "lead_id": lead.id,
            "lead_name": lead.customer_name if lead.customer_name else lead.contact_number,
            "contact_number": lead.contact_number,
            "cohort": lead.cohort,
            "ai_summary": item.ai_summary,
            "intent_strength": item.intent_strength,
            "confirmation_slot": item.confirmation_slot,
            "detected_at": item.detected_at,
            "priority_score": item.priority_score,
            "status": item.status,
            "user_call_count": item.user_call_count,
            "last_user_call_at": item.last_user_call_at,
            "last_ai_call_at": last_ai_call_at,
            "locked_by_user_id": item.locked_by_user_id,
            "lock_expires_at": item.lock_expires_at
        })
        
    return formatted_items

@router.get("/{campaign_id}/next")
async def get_next_lead(
    campaign_id: UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session)
) -> Any:
    """Get and lock the next highest priority lead for a user."""
    # First, rebalance queue to ensure priority is fresh
    await UserQueueWarmer.rebalance_queue(session, campaign_id)
    await UserQueueWarmer.unlock_stale_locks(session, campaign_id)
    
    item = await UserQueueWarmer.get_next_lead(session, campaign_id, current_user.id)
    
    if not item:
        raise HTTPException(status_code=404, detail="No leads ready in queue")
        
    # Get lead details
    lead = await session.get(CampaignLead, item.lead_id)
    
    # Broadcast update
    await manager.broadcast_status_update(str(campaign_id), {"event": "user_queue_update"})
    
    return {
        "item": item,
        "lead": lead,
        "locked_until": item.lock_expires_at
    }

@router.post("/{item_id}/call-status")
async def update_call_status(
    item_id: UUID,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session)
) -> Any:
    """Update call status and logic for a user queue item."""
    item = await session.get(UserQueueItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    status = payload.get("status")
    next_action = payload.get("next_action")
    
    # Create call log
    call_log = UserCallLog(
        user_queue_item_id=item.id,
        lead_id=item.lead_id,
        campaign_id=item.campaign_id,
        user_id=current_user.id,
        status=status,
        next_action=next_action,
        duration=payload.get("duration"),
        notes=payload.get("notes"),
        retry_scheduled_for=payload.get("retry_scheduled_for")
    )
    session.add(call_log)
    
    # Update item
    item.user_call_count += 1
    item.last_user_call_at = datetime.utcnow()
    item.user_call_status = status
    
    # Handle next action
    if next_action == "CLOSE_WON":
        await LeadClosure.close_user_queue_lead(session, item.id, LeadClosure.CLOSURE_WON)
    elif next_action == "CLOSE_LOST":
        await LeadClosure.close_user_queue_lead(session, item.id, LeadClosure.CLOSURE_LOST)
    elif next_action == "RETRY_SCHEDULED":
        # Keep in queue as RESCHEDULED - will appear in separate section
        item.status = "RESCHEDULED"
        item.retry_scheduled_for = payload.get("retry_scheduled_for")
        # Unlock the lead
        item.locked_by_user_id = None
        item.locked_at = None
        item.lock_expires_at = None
    else:
        # Default: close the lead (user logged outcome, no follow-up needed)
        # This moves the lead to history and removes it from the active queue
        await LeadClosure.close_user_queue_lead(session, item.id, "LOGGED_OUTCOME")
        
    session.add(item)
    await session.commit()
    
    # Broadcast update
    await manager.broadcast_status_update(str(item.campaign_id), {"event": "user_queue_update"})
    
    return {"status": "success"}

@router.get("/{item_id}/context")
async def get_lead_context(
    item_id: UUID,
    session: AsyncSession = Depends(get_session)
) -> Any:
    """Get full context for a lead including AI history and user logs."""
    item = await session.get(UserQueueItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    lead = await session.get(CampaignLead, item.lead_id)
    
    # Get user call logs
    user_logs_result = await session.execute(
        select(UserCallLog).where(UserCallLog.lead_id == item.lead_id)
    )
    user_logs = user_logs_result.scalars().all()
    
    # Get AI call logs
    from app.models.call_log import CallLog
    ai_logs_result = await session.execute(
        select(CallLog).where(CallLog.lead_id == item.lead_id)
    )
    ai_logs = ai_logs_result.scalars().all()
    
    # Combine and normalize history
    history = []
    
    for log in ai_logs:
        history.append({
            "type": "AI",
            "id": str(log.id),
            "status": log.status,
            "outcome": log.outcome,
            "summary": log.transcript_summary,
            "created_at": log.created_at,
            "duration": log.duration,
            "recording_url": log.recording_url,
            "full_transcript": log.full_transcript or getattr(log, "transcript", None)  # Fallback to transcript
        })
        
    for log in user_logs:
        history.append({
            "type": "USER",
            "id": str(log.id),
            "status": log.status,
            "outcome": log.status, # User logs use status as outcome roughly
            "summary": log.notes,
            "created_at": log.created_at,
            "duration": log.duration,
            "recording_url": None, # User calls might not have recordings yet
            "full_transcript": None
        })
        
    # Sort chronologically DESC (newest first)
    history.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "user_queue_item": {
            "id": item.id,
            "ai_summary": item.ai_summary,
            "structured_context": item.structured_context,  # [NEW] Structured insights
            "intent_strength": item.intent_strength,
            "confirmation_slot": item.confirmation_slot,
            "detected_at": item.detected_at,
            "priority_score": item.priority_score,
            "status": item.status
        },
        "lead": lead,
        "ai_call_history": item.call_history, # Keep for backward compatibility/quick access
        "user_call_logs": [
            {
                "id": str(log.id),
                "status": log.status,
                "notes": log.notes,
                "created_at": log.created_at,
                "duration": log.duration
            } for log in user_logs
        ],
        "history": history
    }

@router.post("/{item_id}/close")
async def close_lead_endpoint(
    item_id: UUID,
    payload: Dict[str, Any],
    session: AsyncSession = Depends(get_session)
) -> Any:
    """Manually close a lead."""
    reason = payload.get("reason")
    if not reason:
        raise HTTPException(status_code=400, detail="Closure reason is required")
        
    item = await session.get(UserQueueItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    await LeadClosure.close_user_queue_lead(session, item.id, reason)
    
    # Broadcast update
    await manager.broadcast_status_update(str(item.campaign_id), {"event": "user_queue_update"})
    
    return {"status": "success"}

@router.post("/{item_id}/unlock")
async def unlock_lead_endpoint(
    item_id: UUID,
    session: AsyncSession = Depends(get_session)
) -> Any:
    """Manually unlock a lead."""
    item = await session.get(UserQueueItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    item.status = "READY"
    item.locked_by_user_id = None
    item.locked_at = None
    item.lock_expires_at = None
    
    session.add(item)
    await session.commit()
    
    # Broadcast update
    await manager.broadcast_status_update(str(item.campaign_id), {"event": "user_queue_update"})
    
    return {"status": "success"}

@router.post("/{item_id}/boost")
async def boost_lead_endpoint(
    item_id: UUID,
    session: AsyncSession = Depends(get_session)
) -> Any:
    """Manually boost a lead to top priority (Swap)."""
    item = await session.get(UserQueueItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # [FIX] Clear existing boosts to ensure this one is unique at top
    # Fetch all items with manual_priority_boost > 0 for this campaign
    existing_boosts_result = await session.execute(
        select(UserQueueItem).where(
            and_(
                UserQueueItem.campaign_id == item.campaign_id,
                UserQueueItem.manual_priority_boost > 0,
                UserQueueItem.id != item_id
            )
        )
    )
    existing_boosts = existing_boosts_result.scalars().all()

    for boosted_item in existing_boosts:
        boosted_item.manual_priority_boost = 0
        boosted_item.priority_score = UserQueueWarmer._calculate_priority_score(
            confirmation_slot=boosted_item.confirmation_slot,
            intent_strength=boosted_item.intent_strength,
            retry_count=boosted_item.retry_count,
            manual_priority_boost=0,
            detected_at=boosted_item.detected_at
        )
        session.add(boosted_item)

    # Apply massive boost
    # 50000 ensures it beats even the "Committed Time" boost of 10000
    item.manual_priority_boost = 50000
    
    # Recalculate priority immediately
    item.priority_score = UserQueueWarmer._calculate_priority_score(
        confirmation_slot=item.confirmation_slot,
        intent_strength=item.intent_strength,
        retry_count=item.retry_count,
        manual_priority_boost=item.manual_priority_boost,
        detected_at=item.detected_at
    )
    
    session.add(item)
    await session.commit()
    
    # Broadcast update
    await manager.broadcast_status_update(str(item.campaign_id), {"event": "user_queue_update"})
    
    return {"status": "success", "new_priority": item.priority_score}
