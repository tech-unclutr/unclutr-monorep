import asyncio
from uuid import UUID
from app.core.db import async_session_factory
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from sqlmodel import select, and_, or_

async def check_priority():
    async with async_session_factory() as session:
        campaign_id = UUID('ff4d88d2-9c17-4da6-90a5-c8eceb976566')
        
        stmt = (
            select(QueueItem, CampaignLead)
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .where(QueueItem.campaign_id == campaign_id)
            .where(QueueItem.status == "READY")
            .order_by(QueueItem.priority_score.desc(), QueueItem.created_at.asc())
            .limit(5)
        )
        
        result = await session.execute(stmt)
        items = result.all()
        
        print(f"Top 5 READY leads for campaign {campaign_id}:")
        for q_item, lead in items:
            print(f"  Lead: {lead.customer_name}, Priority: {q_item.priority_score}, Created: {q_item.created_at}, Status: {q_item.status}")

if __name__ == "__main__":
    asyncio.run(check_priority())
