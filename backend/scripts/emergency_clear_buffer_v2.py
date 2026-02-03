import asyncio
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import select, delete
from app.core.db import async_session_factory
from app.models.queue_item import QueueItem
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.campaign import Campaign

RETENTION_CAMPAIGN_ID = "a390371e-28a4-43a9-b8e3-befc774011cb"

async def main():
    async with async_session_factory() as session:
        print("[*] Clearing DIALING_INTENT and READY buffer for Retention Feb 2026 (Safe Mode)...")
        
        # Count items
        stmt = select(QueueItem).where(QueueItem.campaign_id == RETENTION_CAMPAIGN_ID).where(QueueItem.status.in_(["DIALING_INTENT", "READY", "PENDING"]))
        res = await session.execute(stmt)
        items = res.scalars().all()
        
        print(f"Found {len(items)} items pending in buffer.")
        
        for item in items:
            # Check for constraints
            map_stmt = select(BolnaExecutionMap).where(BolnaExecutionMap.queue_item_id == item.id)
            maps = (await session.execute(map_stmt)).scalars().all()
            
            if maps:
                print(f"QueueItem {item.id} has {len(maps)} execution maps. Marking as FAILED instead of deleting.")
                item.status = "FAILED"
                session.add(item)
            else:
                 print(f"QueueItem {item.id} has no maps. Deleting.")
                 # Safe to delete
                 await session.delete(item)
            
        await session.commit()
        print("[*] Buffer cleared safely.")

if __name__ == "__main__":
    asyncio.run(main())
