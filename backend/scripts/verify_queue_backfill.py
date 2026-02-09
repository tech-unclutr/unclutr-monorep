import asyncio
import sys
import os
from uuid import uuid4
from datetime import datetime

# Add parent directory to path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import async_session_factory
from app.models.campaign import Campaign
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from app.models.user_queue_item import UserQueueItem
from app.api.v1.endpoints.user_queue import get_user_queue
from sqlalchemy import delete
from sqlmodel import select

async def verify_backfill_logic():
    async with async_session_factory() as session:
        print("--- Setting up Test Data ---")
        
        # 1. Create Test Company/User context (using dummy IDs or existing if needed, 
        # but Campaign doesn't strictly enforce foreign keys in this script unless we commit and DB enforces)
        # We'll use random UUIDs for brevity as we are testing logic, not DB constraints mostly.
        # However, to be safe, let's use a real company if possible or just randoms.
        company_id = uuid4()
        user_id = "test_user"
        campaign_id = uuid4()
        
        # 2. Create Campaign (DRAFT)
        campaign = Campaign(
            id=campaign_id,
            company_id=company_id,
            user_id=user_id,
            name="Test Backfill Campaign",
            status="DRAFT"
        )
        session.add(campaign)
        
        # 3. Create Leads and QueueItems
        leads = []
        queue_items = []
        for i in range(5):
            lead = CampaignLead(
                id=uuid4(),
                campaign_id=campaign_id,
                company_id=company_id,
                contact_number=f"+100000000{i}",
                customer_name=f"Test Lead {i}"
            )
            session.add(lead)
            leads.append(lead)
            
            qi = QueueItem(
                id=uuid4(),
                campaign_id=campaign_id,
                lead_id=lead.id,
                status="READY",
                priority_score=100,
                created_at=datetime.utcnow()
            )
            session.add(qi)
            queue_items.append(qi)
            
        await session.commit()
        print(f"Created Campaign {campaign_id} (DRAFT) and 5 QueueItems.")
        
        # 4. Test 1: Call API logic - Should be EMPTY
        print("\n--- Test 1: DRAFT Campaign ---")
        # We need to simulate the API call. We can call get_user_queue directly 
        # but it expects dependency injection. We can pass session manually.
        # Note: get_user_queue is an endpoint def, we can call it as a coroutine if we pass args.
        
        # Arguments: campaign_id, status=None, refresh=False, limit=50, offset=0, session=session
        items = await get_user_queue(
            campaign_id=campaign_id,
            session=session,
            status=None,
            refresh=False,
            limit=50,
            offset=0
        )
        
        print(f"User Queue Items returned: {len(items)}")
        
        if len(items) == 0:
            print("SUCCESS: No items backfilled for DRAFT campaign.")
        else:
            print(f"FAILURE: {len(items)} items backfilled for DRAFT campaign!")
            
        # 5. Test 2: Set to ACTIVE
        print("\n--- Test 2: ACTIVE Campaign ---")
        campaign.status = "ACTIVE"
        session.add(campaign)
        await session.commit()
        
        items_active = await get_user_queue(
            campaign_id=campaign_id,
            session=session,
            status=None,
            refresh=False,
            limit=50,
            offset=0
        )
        
        print(f"User Queue Items returned: {len(items_active)}")
        
        if len(items_active) == 5:
            print("SUCCESS: Items properly backfilled for ACTIVE campaign.")
        else:
            print(f"FAILURE: Expected 5 items, got {len(items_active)}")

        # Cleanup
        print("\n--- Cleanup ---")
        # Delete UserQueueItems first
        await session.execute(delete(UserQueueItem).where(UserQueueItem.campaign_id == campaign_id))
        await session.execute(delete(QueueItem).where(QueueItem.campaign_id == campaign_id))
        await session.execute(delete(CampaignLead).where(CampaignLead.campaign_id == campaign_id))
        await session.execute(delete(Campaign).where(Campaign.id == campaign_id))
        await session.commit()
        print("Test data cleaned up.")

if __name__ == "__main__":
    asyncio.run(verify_backfill_logic())
