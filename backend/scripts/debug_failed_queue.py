import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import select, desc
from app.core.db import async_session_factory
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead

async def main():
    async with async_session_factory() as session:
        print("[*] --- Latest 10 FAILED Queue Items ---")
        stmt = (
            select(QueueItem, CampaignLead)
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .where(QueueItem.status == "FAILED")
            .order_by(desc(QueueItem.updated_at))
            .limit(10)
        )
        
        res = await session.execute(stmt)
        items = res.all()
        
        if items:
            for item, lead in items:
                print(f"Time: {item.updated_at} | Lead: {lead.customer_name} ({lead.contact_number}) | Cohort: {lead.cohort}")
        else:
            print("No FAILED QueueItems found.")

if __name__ == "__main__":
    asyncio.run(main())
