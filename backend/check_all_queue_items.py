import asyncio
from uuid import UUID
from app.core.db import async_session_factory
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from sqlmodel import select

async def check_all_items():
    async with async_session_factory() as session:
        campaign_id = UUID('ff4d88d2-9c17-4da6-90a5-c8eceb976566')
        
        stmt = (
            select(QueueItem, CampaignLead)
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .where(QueueItem.campaign_id == campaign_id)
            .order_by(QueueItem.status, QueueItem.priority_score.desc())
        )
        
        result = await session.execute(stmt)
        items = result.all()
        
        print(f"All items for campaign {campaign_id}:")
        for q_item, lead in items:
            print(f"  Lead: {lead.customer_name}, Status: {q_item.status}, Priority: {q_item.priority_score}, Execution: {q_item.execution_count}")

if __name__ == "__main__":
    asyncio.run(check_all_items())
