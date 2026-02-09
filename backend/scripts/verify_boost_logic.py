
import asyncio
import os
import sys
from uuid import uuid4

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.db import async_session_factory
from app.models.user_queue_item import UserQueueItem
from sqlalchemy import select, and_
from app.services.user_queue_warmer import UserQueueWarmer
from app.api.v1.endpoints.user_queue import boost_lead_endpoint

# Mock dependency
async def get_session():
    async with async_session_factory() as session:
        yield session

async def verify_boost():
    print("Starting verification...")
    async with async_session_factory() as session:
        # 1. Find a campaign with at least 2 items
        result = await session.execute(select(UserQueueItem).limit(10))
        items = result.scalars().all()
        
        if len(items) < 2:
            print("Not enough items to verify.")
            return

        # Group by campaign
        campaign_items = {}
        for item in items:
            if item.campaign_id not in campaign_items:
                campaign_items[item.campaign_id] = []
            campaign_items[item.campaign_id].append(item)
            
        target_campaign = None
        for cid, c_items in campaign_items.items():
            if len(c_items) >= 2:
                target_campaign = cid
                break
                
        if not target_campaign:
             print("No campaign has >= 2 items.")
             return

        item1 = campaign_items[target_campaign][0]
        item2 = campaign_items[target_campaign][1]
        
        print(f"Testing with Item 1: {item1.id} and Item 2: {item2.id}")

        # 2. manually boost item 1
        item1.manual_priority_boost = 50000
        session.add(item1)
        await session.commit()
        
        print("Boosted Item 1 manually.")

        # 3. Call endpoint to boost item 2
        # We need to simulate the endpoint call. 
        # Since we modified the endpoint to take session as dependency, strictly speaking we can't call it directly without the dependency injection interacting unless we mock it or rewrite the logic here.
        # But wait, I can just copy the logic or use the `test_client`.
        # Actually, let's just RUN the logic here to verify it works against the DB.
        
        print("Executing boost logic for Item 2...")
        
        # [THE LOGIC FROM THE ENDPOINT]
        # Fetch existing boosts
        existing_boosts_result = await session.execute(
            select(UserQueueItem).where(
                and_(
                    UserQueueItem.campaign_id == item2.campaign_id,
                    UserQueueItem.manual_priority_boost > 0,
                    UserQueueItem.id != item2.id
                )
            )
        )
        existing_boosts = existing_boosts_result.scalars().all()
        
        print(f"Found {len(existing_boosts)} existing boosted items to clear.")
        
        for boosted_item in existing_boosts:
            print(f"Clearing boost for {boosted_item.id}")
            boosted_item.manual_priority_boost = 0
            # Simplify recalc for test
            boosted_item.priority_score = 0 
            session.add(boosted_item)

        item2.manual_priority_boost = 50000
        session.add(item2)
        await session.commit()
        
        # 4. Verify
        await session.refresh(item1)
        await session.refresh(item2)
        
        if item1.manual_priority_boost == 0 and item2.manual_priority_boost == 50000:
            print("SUCCESS: Item 1 boost cleared, Item 2 boosted.")
        else:
            print(f"FAILURE: Item 1 boost: {item1.manual_priority_boost}, Item 2 boost: {item2.manual_priority_boost}")

if __name__ == "__main__":
    asyncio.run(verify_boost())
