"""
Clean all call-related data for fresh start.

This script removes:
- Call logs
- Bolna execution maps
- Campaign events
- Call raw data
- Resets queue items to PENDING state
"""

import asyncio
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.models.call_log import CallLog
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.campaign_event import CampaignEvent
from app.models.call_raw_data import CallRawData
from app.models.queue_item import QueueItem


async def clean_call_data():
    """Clean all call-related data."""
    async with AsyncSession(engine) as session:
        print("🧹 Starting call data cleanup...")
        
        # 1. Delete all call logs
        result = await session.execute(select(CallLog))
        call_logs = result.scalars().all()
        for log in call_logs:
            await session.delete(log)
        print(f"   ✓ Deleted {len(call_logs)} call logs")
        
        # 2. Delete all Bolna execution maps
        result = await session.execute(select(BolnaExecutionMap))
        exec_maps = result.scalars().all()
        for em in exec_maps:
            await session.delete(em)
        print(f"   ✓ Deleted {len(exec_maps)} Bolna execution maps")
        
        # 3. Delete all campaign events
        result = await session.execute(select(CampaignEvent))
        events = result.scalars().all()
        for event in events:
            await session.delete(event)
        print(f"   ✓ Deleted {len(events)} campaign events")
        
        # 4. Delete all call raw data
        result = await session.execute(select(CallRawData))
        raw_data = result.scalars().all()
        for rd in raw_data:
            await session.delete(rd)
        print(f"   ✓ Deleted {len(raw_data)} raw data entries")
        
        # 5. Reset queue items to PENDING (keep the leads, just reset their state)
        result = await session.execute(select(QueueItem))
        queue_items = result.scalars().all()
        reset_count = 0
        for qi in queue_items:
            if qi.status not in ["PENDING", "SCHEDULED"]:
                qi.status = "PENDING"
                qi.outcome = None
                qi.execution_count = 0
                qi.scheduled_for = None
                qi.locked_by_user_id = None
                qi.locked_at = None
                session.add(qi)
                reset_count += 1
        print(f"   ✓ Reset {reset_count} queue items to PENDING")
        
        await session.commit()
        print("✅ Call data cleanup complete!")


if __name__ == "__main__":
    asyncio.run(clean_call_data())
