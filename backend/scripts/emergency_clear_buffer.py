import asyncio
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import select, delete
from app.core.db import async_session_factory
from app.models.queue_item import QueueItem
from app.models.campaign import Campaign

RETENTION_CAMPAIGN_ID = "a390371e-28a4-43a9-b8e3-befc774011cb"

async def main():
    async with async_session_factory() as session:
        print("[*] Clearing DIALING_INTENT and READY buffer for Retention Feb 2026...")
        
        # Verify Campaign Status
        camp = await session.get(Campaign, RETENTION_CAMPAIGN_ID)
        print(f"Campaign Status: {camp.status}")
        
        # Count items
        stmt = select(QueueItem).where(QueueItem.campaign_id == RETENTION_CAMPAIGN_ID).where(QueueItem.status.in_(["DIALING_INTENT", "READY", "PENDING"]))
        res = await session.execute(stmt)
        items = res.scalars().all()
        
        print(f"Found {len(items)} items pending in buffer.")
        
        # Reset them to ELIGIBLE (Backlog) so they don't get called
        # Or delete them if that's safer, but reset preserves the lead
        # Actually reset to ELIGIBLE/BACKLOG usually involves deleting the QueueItem
        
        for item in items:
            await session.delete(item)
            
        await session.commit()
        print("[*] Buffer cleared.")

if __name__ == "__main__":
    asyncio.run(main())
