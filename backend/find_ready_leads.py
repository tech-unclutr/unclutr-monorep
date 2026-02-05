
import asyncio
import os
import sys
from sqlalchemy.future import select

sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.queue_item import QueueItem
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead

async def find_ready_leads():
    async with async_session_factory() as session:
        stmt = (
            select(QueueItem, Campaign, CampaignLead)
            .join(Campaign, QueueItem.campaign_id == Campaign.id)
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .where(QueueItem.status == 'READY')
        )
        result = await session.execute(stmt)
        items = result.all()
        
        print(f"Total READY leads: {len(items)}")
        for q, c, l in items:
            print(f"Campaign: {c.name} ({c.id}) | Lead: {l.customer_name} | QStatus: {q.status}")

if __name__ == "__main__":
    asyncio.run(find_ready_leads())
