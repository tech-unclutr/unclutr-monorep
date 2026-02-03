from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, desc

from app.api.deps import get_session, get_current_active_user
from app.models.user import User
from app.models.call_log import CallLog
from app.models.campaign_lead import CampaignLead

router = APIRouter()

@router.get("/campaign/{campaign_id}/logs")
async def get_campaign_logs(
    campaign_id: UUID,
    page: int = 1,
    page_size: int = 20,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Fetch persistent call logs for a campaign.
    """
    offset = (page - 1) * page_size
    
    # query logs with lead details
    statement = (
        select(CallLog, CampaignLead)
        .join(CampaignLead, CallLog.lead_id == CampaignLead.id)
        .where(CallLog.campaign_id == campaign_id)
        .order_by(desc(CallLog.updated_at))
        .offset(offset)
        .limit(page_size)
    )
    
    result = await session.execute(statement)
    rows = result.all()
    
    logs = []
    for log, lead in rows:
        logs.append({
            "id": log.id,
            "bolna_call_id": log.bolna_call_id,
            "status": log.status,
            "outcome": log.outcome,
            "duration": log.duration,
            "total_cost": log.total_cost,
            "currency": log.currency,
            "created_at": log.created_at,
            "transcript_summary": log.transcript_summary,
            "recording_url": log.recording_url,
            "termination_reason": log.termination_reason,
            "lead": {
                "id": lead.id,
                "name": lead.customer_name,
                "number": lead.contact_number,
                "cohort": lead.cohort
            }
        })
        
    return {
        "data": logs,
        "page": page,
        "page_size": page_size
    }
