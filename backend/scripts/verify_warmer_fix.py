import asyncio
from datetime import datetime
from app.core.db import async_session_factory
from sqlmodel import select
from app.models.queue_item import QueueItem
from app.services.queue_warmer import QueueWarmer
from app.models.campaign import Campaign

async def verify_fix():
    async with async_session_factory() as session:
        print(f"Local Time Now: {datetime.now()}")
        
        # 1. Find the Scheduled Item
        stmt = select(QueueItem).where(QueueItem.status == "SCHEDULED")
        result = await session.execute(stmt)
        item = result.scalars().first()
        
        if not item:
            print("No SCHEDULED items found. Verification cannot proceed (or item already woke up).")
            # Check for READY items to confirm
            r_stmt = select(QueueItem).where(QueueItem.status.in_(["READY", "DIALING_INTENT"])).order_by(QueueItem.updated_at.desc())
            recent = (await session.execute(r_stmt)).scalars().first()
            if recent:
                print(f"Found recently active item: {recent.id} Status={recent.status}")
            return

        print(f"DEBUG: Found Item: {item.id}")
        print(f"DEBUG: Item status={item.status}")
        print(f"DEBUG: Item scheduled_for={item.scheduled_for!r} (Type: {type(item.scheduled_for)})")
        print(f"DEBUG: Campaign ID={item.campaign_id}")
        
        # 2. Trigger Wake Up
        campaign = await session.get(Campaign, item.campaign_id)
        print(f"DEBUG: Campaign Status={campaign.status}")
        
        # Test Query Logic Manually
        print("DEBUG: Testing QueueWarmer query manually...")
        test_now = datetime.now()
        test_stmt = (
            select(QueueItem)
            .where(QueueItem.campaign_id == campaign.id)
            .where(QueueItem.status == "SCHEDULED")
            .where(QueueItem.scheduled_for <= test_now)
        )
        test_res = (await session.execute(test_stmt)).scalars().all()
        print(f"DEBUG: Manual Query found {len(test_res)} items matching condition <= {test_now}")

        if not test_res:
             print("DEBUG: Manual Query FAILED. Why?")
             print(f"DEBUG: {item.scheduled_for} <= {test_now} is {item.scheduled_for <= test_now}")
             
        print("Triggering _wake_scheduled_items...")
        await QueueWarmer._wake_scheduled_items(session, campaign)
        
        # 3. Check Status Again
        await session.refresh(item)
        print(f"Item Status After Trigger: {item.status}")
        
        if item.status == "READY":
            print("SUCCESS: Item moved to READY.")
        else:
            print("FAILURE: Item still SCHEDULED.")

if __name__ == "__main__":
    asyncio.run(verify_fix())
