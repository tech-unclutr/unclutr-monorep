import asyncio
from app.core.db import async_session_factory
from sqlmodel import select
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem
from app.models.campaign import Campaign

async def inspect_param():
    async with async_session_factory() as session:
        # Find Lead
        stmt = select(CampaignLead).where(CampaignLead.customer_name == "Param")
        result = await session.execute(stmt)
        lead = result.scalars().first()
        
        if not lead:
            print("Lead 'Param' not found.")
            return

        print(f"Lead Found: {lead.id}, Name: {lead.customer_name}, Number: {lead.contact_number}")

        # Find QueueItem
        q_stmt = select(QueueItem).where(QueueItem.lead_id == lead.id)
        q_result = await session.execute(q_stmt)
        items = q_result.scalars().all()
        
        if not items:
            print("No QueueItem found for this lead.")
        else:
            for item in items:
                print(f"QueueItem: ID={item.id}, Status={item.status}, ScheduledFor={item.scheduled_for}, Priority={item.priority_score}")
                
        # Check Campaign Status
        if items:
            camp = await session.get(Campaign, items[0].campaign_id)
            print(f"Campaign Status: {camp.status}")

if __name__ == "__main__":
    asyncio.run(inspect_param())
