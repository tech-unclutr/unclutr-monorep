import asyncio
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import select
from app.core.db import async_session_factory
from app.models.queue_item import QueueItem
from app.models.campaign import Campaign

CHURN_CAMPAIGN_ID = "7b277bac-9157-4c01-9b6e-3b28b088e0b4"

async def main():
    async with async_session_factory() as session:
        print("[*] Resetting FAILED items to READY for Churn Feb 2026...")
        
        stmt = select(QueueItem).where(QueueItem.campaign_id == CHURN_CAMPAIGN_ID).where(QueueItem.status == "FAILED")
        res = await session.execute(stmt)
        items = res.scalars().all()
        
        print(f"Found {len(items)} FAILED items.")
        
        for item in items:
            item.status = "READY"
            item.execution_count = 0 # Reset count to ensure fresh start
            session.add(item)
            
        await session.commit()
        print("[*] Reset complete. Please restart server and try again.")

if __name__ == "__main__":
    asyncio.run(main())
