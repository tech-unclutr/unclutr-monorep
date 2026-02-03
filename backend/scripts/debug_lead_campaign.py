import asyncio
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import select
from app.core.db import async_session_factory
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from app.models.campaign import Campaign

async def main():
    async with async_session_factory() as session:
        names = ["Param", "Kunj"]
        print("[*] Checking Campaign & Status for Param/Kunj")
        
        for name in names:
            leads = (await session.execute(select(CampaignLead).where(CampaignLead.customer_name.contains(name)))).scalars().all()
            for lead in leads:
                q_items = (await session.execute(select(QueueItem).where(QueueItem.lead_id == lead.id))).scalars().all()
                for q in q_items:
                    camp = await session.get(Campaign, q.campaign_id)
                    print(f"Lead: {lead.customer_name} | Q_Status: {q.status} | Camp: {camp.name} (ID: {camp.id}) | ExecCount: {q.execution_count}")

if __name__ == "__main__":
    asyncio.run(main())
