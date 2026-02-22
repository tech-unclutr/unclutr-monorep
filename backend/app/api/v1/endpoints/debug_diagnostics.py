from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.api.deps import get_session
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead

router = APIRouter()

@router.get("/queue-status")
async def debug_queue_status(session: AsyncSession = Depends(get_session)):
    try:
        stmt = (
            select(QueueItem, CampaignLead)
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .where(QueueItem.status.in_(['DIALING_INTENT', 'READY']))
            .order_by(QueueItem.created_at.desc())
            .limit(10)
        )
        result = await session.execute(stmt)
        # Get summary of all statuses
        from sqlalchemy import func
        count_stmt = select(QueueItem.status, func.count(QueueItem.id)).group_by(QueueItem.status)
        count_result = await session.execute(count_stmt)
        counts = {status: count for status, count in count_result.all()}

        return {
            "counts": counts,
            "recent_active_items": items
        }
    except Exception as e:
        return {"error": str(e)}
