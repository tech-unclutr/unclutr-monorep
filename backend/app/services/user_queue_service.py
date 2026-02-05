"""
User Queue Service

Manages copying leads to the user queue when they express interest,
with full call context and preferred slot handling.
"""

from datetime import datetime
from typing import Dict, Optional
from uuid import UUID

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.call_log import CallLog
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem


async def copy_lead_to_user_queue(
    campaign_id: UUID,
    lead_id: UUID,
    call_log_id: UUID,
    preferred_slot: Optional[Dict] = None,
    session: AsyncSession = None
) -> Optional[QueueItem]:
    """
    Copy a lead to the user queue with full call context.
    
    This is called when a lead expresses interest (agreement status = yes).
    The lead is added to the queue with READY status so a human can follow up.
    
    Args:
        campaign_id: Campaign UUID
        lead_id: Lead UUID
        call_log_id: Call log UUID that triggered the copy
        preferred_slot: Optional preferred time slot from customer
        session: Database session
    
    Returns:
        Created QueueItem or None if already exists
    """
    if not session:
        raise ValueError("Database session is required")
    
    # 1. Check if lead is already in user queue for this campaign
    existing_stmt = (
        select(QueueItem)
        .where(QueueItem.campaign_id == campaign_id)
        .where(QueueItem.lead_id == lead_id)
        .where(QueueItem.status == "READY")  # Only check READY items (user queue)
    )
    existing_result = await session.execute(existing_stmt)
    existing_item = existing_result.scalar_one_or_none()
    
    if existing_item:
        print(f"[UserQueue] Lead {lead_id} already in user queue, skipping copy")
        return None
    
    # 2. Fetch lead details
    lead = await session.get(CampaignLead, lead_id)
    if not lead:
        print(f"[UserQueue] Lead {lead_id} not found")
        return None
    
    # 3. Fetch call log for context
    call_log = await session.get(CallLog, call_log_id)
    if not call_log:
        print(f"[UserQueue] Call log {call_log_id} not found")
        return None
    
    # 4. Prepare metadata with full context
    meta_data = {
        "source": "auto_copy_from_ai_call",
        "trigger_call_id": str(call_log_id),
        "trigger_outcome": call_log.outcome,
        "trigger_timestamp": call_log.created_at.isoformat() if call_log.created_at else None,
        "call_duration": call_log.duration,
        "call_summary": call_log.webhook_payload.get("transcript_summary") if call_log.webhook_payload else None,
    }
    
    # Add preferred slot if provided
    if preferred_slot and preferred_slot.get("requested"):
        meta_data["preferred_slot_source"] = "customer_request"
        meta_data["preferred_slot"] = preferred_slot
    
    # 5. Determine scheduled_for time
    scheduled_for = None
    if preferred_slot and preferred_slot.get("start_time"):
        try:
            scheduled_for = datetime.fromisoformat(preferred_slot["start_time"].replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            print(f"[UserQueue] Invalid preferred slot time: {preferred_slot.get('start_time')}")
    
    # 6. Create queue item with READY status (user queue)
    # Priority will be handled by separate warmer agent as per user request
    queue_item = QueueItem(
        campaign_id=campaign_id,
        lead_id=lead_id,
        status="READY",  # READY = waiting for human to call
        priority_score=100.0,  # High priority for interested leads
        scheduled_for=scheduled_for,
        meta_data=meta_data
    )
    
    session.add(queue_item)
    
    # 7. Update call log to mark as copied
    call_log.copied_to_user_queue = True
    call_log.copied_to_queue_at = datetime.utcnow()
    call_log.user_queue_item_id = queue_item.id
    session.add(call_log)
    
    await session.commit()
    await session.refresh(queue_item)
    
    print(f"[UserQueue] Successfully copied lead {lead_id} to user queue as {queue_item.id}")
    
    return queue_item


async def is_lead_in_user_queue(
    campaign_id: UUID,
    lead_id: UUID,
    session: AsyncSession
) -> bool:
    """
    Check if a lead is already in the user queue.
    
    Args:
        campaign_id: Campaign UUID
        lead_id: Lead UUID
        session: Database session
    
    Returns:
        True if lead is in user queue
    """
    stmt = (
        select(QueueItem)
        .where(QueueItem.campaign_id == campaign_id)
        .where(QueueItem.lead_id == lead_id)
        .where(QueueItem.status == "READY")
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none() is not None
