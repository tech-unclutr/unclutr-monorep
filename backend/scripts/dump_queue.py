import asyncio
from app.core.db import async_session_factory
from sqlmodel import select
from app.models.queue_item import QueueItem

async def dump_items():
    async with async_session_factory() as session:
        result = await session.execute(select(QueueItem))
        items = result.scalars().all()
        for item in items:
            print(f"ID: {item.id} | Lead: {item.lead_id} | Status: {item.status} | Scheduled: {item.scheduled_for} | Campaign: {item.campaign_id}")

if __name__ == "__main__":
    asyncio.run(dump_items())
