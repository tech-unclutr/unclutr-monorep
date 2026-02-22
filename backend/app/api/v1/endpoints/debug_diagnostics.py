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
            .where(QueueItem.status == 'DIALING_INTENT')
            .order_by(QueueItem.created_at.desc())
            .limit(10)
        )
        result = await session.execute(stmt)
        items = []
        for q, l in result.all():
            items.append({
                "lead_name": f"{l.first_name} {l.last_name}",
                "queue_item_id": str(q.id),
                "status": q.status,
                "execution_count": q.execution_count,
                "outcome": q.outcome,
                "updated_at": str(q.updated_at)
            })
        return {"items": items}
    except Exception as e:
        return {"error": str(e)}
