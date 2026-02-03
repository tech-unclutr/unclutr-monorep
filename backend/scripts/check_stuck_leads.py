import asyncio
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import select
from app.core.db import async_session_factory
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead

async def main():
    async with async_session_factory() as session:
        print("[*] Checking for specific error leads in queue...")
        names = ["Gaurav Hegde", "Kavya Malhotra", "Shreya Bhat", "Rohan Sood", "Avni Pandey", "Saanvi Iyer"]
        
        for name in names:
            stmt = (
                select(QueueItem, CampaignLead)
                .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
                .where(CampaignLead.customer_name.contains(name.split()[0])) # Match first name
            )
            res = await session.execute(stmt)
            items = res.all()
            for item, lead in items:
                print(f"FOUND: {lead.customer_name} | Queue Status: {item.status} | Campaign: {item.campaign_id}")

if __name__ == "__main__":
    asyncio.run(main())
