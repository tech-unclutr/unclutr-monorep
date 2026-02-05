import asyncio
from uuid import UUID
from sqlmodel import select
from app.core.db import AsyncSession
from app.models.queue_item import QueueItem

async def check_queue_timestamps(campaign_id_str):
    campaign_id = UUID(campaign_id_str)
    from sqlalchemy.ext.asyncio import create_async_engine
    from app.core.config import settings
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with AsyncSession(engine) as session:
        stmt = select(QueueItem).where(QueueItem.campaign_id == campaign_id)
        items = (await session.execute(stmt)).scalars().all()
        for i in items:
            print(f"DEBUG: Item ID: {i.id}, Created At: {i.created_at}, Status: {i.status}")

if __name__ == "__main__":
    campaign_id = "ff4d88d2-9c17-4da6-90a5-c8eceb976566"
    asyncio.run(check_queue_timestamps(campaign_id))
