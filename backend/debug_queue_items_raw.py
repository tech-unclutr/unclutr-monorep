import asyncio
from uuid import UUID
from sqlmodel import select
from app.core.db import AsyncSession
from app.models.queue_item import QueueItem

async def check_queue_items_raw(campaign_id_str):
    campaign_id = UUID(campaign_id_str)
    from sqlalchemy.ext.asyncio import create_async_engine
    from app.core.config import settings
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with AsyncSession(engine) as session:
        stmt = select(QueueItem).where(QueueItem.campaign_id == campaign_id)
        items = (await session.execute(stmt)).scalars().all()
        print(f"DEBUG: Found {len(items)} QueueItems total.")
        for i in items:
            print(f"DEBUG: Item ID: {i.id}, Lead ID: {i.lead_id}, Status: {i.status}, Campaign ID: {i.campaign_id}")

if __name__ == "__main__":
    campaign_id = "ff4d88d2-9c17-4da6-90a5-c8eceb976566"
    asyncio.run(check_queue_items_raw(campaign_id))
