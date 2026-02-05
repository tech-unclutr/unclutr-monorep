import asyncio
from uuid import UUID
from sqlalchemy import func
from sqlmodel import select
from app.core.db import AsyncSession
from app.models.queue_item import QueueItem
from app.models.campaign import Campaign

async def check_queue_status(campaign_id_str):
    campaign_id = UUID(campaign_id_str)
    from sqlalchemy.ext.asyncio import create_async_engine
    from app.core.config import settings
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with AsyncSession(engine) as session:
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
             print(f"DEBUG: Campaign {campaign_id} not found")
             return
             
        print(f"DEBUG: Campaign: {campaign.name} ({campaign.status})")
        
        # Count items by status
        stmt = select(QueueItem.status, func.count(QueueItem.id)).where(QueueItem.campaign_id == campaign_id).group_by(QueueItem.status)
        result = await session.execute(stmt)
        rows = result.all()
        print("\nDEBUG: Queue Counts:")
        if not rows:
             print("  No QueueItems found")
        for status, count in rows:
            print(f"  {status}: {count}")
            
        # Check for ALL items
        stmt = select(QueueItem).where(QueueItem.campaign_id == campaign_id)
        items = (await session.execute(stmt)).scalars().all()
        print(f"\nDEBUG: Found {len(items)} QueueItems total.")
        for item in items:
            print(f"  Item ID: {item.id}, Lead ID: {item.lead_id}, Status: {item.status}")

if __name__ == "__main__":
    campaign_id = "ff4d88d2-9c17-4da6-90a5-c8eceb976566"
    asyncio.run(check_queue_status(campaign_id))
