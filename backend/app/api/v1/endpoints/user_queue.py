from datetime import datetime
from typing import Any, Optional, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, desc

from app.api.deps import get_session, get_current_active_user
from app.models.user import User
from app.models.user_queue_item import UserQueueItem
from app.models.user_call_log import UserCallLog
from app.models.campaign_lead import CampaignLead
from app.services.user_queue_warmer import UserQueueWarmer
from app.services.lead_closure import LeadClosure
from app.services.websocket_manager import manager

router = APIRouter()

@router.get("/{campaign_id}")
async def get_user_queue(
    campaign_id: UUID,
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    session: AsyncSession = Depends(get_session)
) -> Any:
    """Fetch all user queue items for a campaign, sorted by priority."""
    query = select(UserQueueItem, CampaignLead).join(
        CampaignLead, UserQueueItem.lead_id == CampaignLead.id
    ).where(UserQueueItem.campaign_id == campaign_id)
    
    if status:
        query = query.where(UserQueueItem.status == status)
    else:
        # Default to non-closed items
        query = query.where(UserQueueItem.status != "CLOSED")
        
    # Sort by priority score DESC
    query = query.order_by(desc(UserQueueItem.priority_score), UserQueueItem.detected_at.asc())
    query = query.offset(offset).limit(limit)
    
    result = await session.execute(query)
    items = result.all()
    
    formatted_items = []
    for item, lead in items:
        formatted_items.append({
            "id": item.id,
            "lead_id": lead.id,
            "lead_name": f"{lead.first_name} {lead.last_name}" if lead.first_name else lead.contact_number,
            "contact_number": lead.contact_number,
            "ai_summary": item.ai_summary,
            "intent_strength": item.intent_strength,
            "confirmation_slot": item.confirmation_slot,
            "detected_at": item.detected_at,
            "priority_score": item.priority_score,
            "status": item.status,
            "user_call_count": item.user_call_count,
            "last_user_call_at": item.last_user_call_at,
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
        item.status = "RESCHEDULED"
        item.retry_scheduled_for = payload.get("retry_scheduled_for")
        # Keep it in READY so it appears in queue at the right time (warmer will rebalance)
        item.status = "READY"
        # Immediate unlock
        item.locked_by_user_id = None
        item.locked_at = None
        item.lock_expires_at = None
    else:
        # Default unlock
        item.status = "READY"
        item.locked_by_user_id = None
        item.locked_at = None
        item.lock_expires_at = None
        
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
    logs_result = await session.execute(
        select(UserCallLog).where(UserCallLog.user_queue_item_id == item_id).order_by(desc(UserCallLog.created_at))
    )
    user_logs = logs_result.scalars().all()
    
    return {
        "user_queue_item": item,
        "lead": lead,
        "ai_call_history": item.call_history,
        "user_call_logs": user_logs
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
