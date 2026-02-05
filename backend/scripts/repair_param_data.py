import asyncio
from datetime import datetime
from app.core.db import async_session_factory
from sqlmodel import select
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem

async def repair_data():
    async with async_session_factory() as session:
        # Find Lead
        stmt = select(CampaignLead).where(CampaignLead.customer_name == "Param")
        lead = (await session.execute(stmt)).scalars().first()
        
        if not lead:
            print("Lead Param not found")
            return

        # Find Queue Item
        q_stmt = select(QueueItem).where(QueueItem.lead_id == lead.id)
        item = (await session.execute(q_stmt)).scalars().first()
        
        if item:
            print(f"Found Item: {item.id} Status={item.status} Time={item.scheduled_for}")
            
            # REPAIR
            fixed_time = datetime(2026, 2, 4, 10, 0, 0)
            print(f"Repairing: Setting stats=SCHEDULED and time={fixed_time}")
            
            item.status = "SCHEDULED"
            item.scheduled_for = fixed_time
            session.add(item)
            await session.commit()
            print("Repaired.")
        else:
            print("No item found.")

if __name__ == "__main__":
    asyncio.run(repair_data())
