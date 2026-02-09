import asyncio
import sys
import os
from uuid import UUID
from datetime import datetime
from sqlmodel import select, desc

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.user_queue_item import UserQueueItem
from app.models.campaign_lead import CampaignLead

async def inspect_user_queue(campaign_id_str):
    async with async_session_factory() as session:
        try:
            campaign_id = UUID(campaign_id_str)
        except ValueError:
            # Try to find a campaign if ID is not valid UUID or provided
            # For now, let's just list all campaigns?
            # Or just assume the one from previous scripts
            print(f"Invalid UUID: {campaign_id_str}")
            return

        print(f"--- Inspecting UserQueue for Campaign {campaign_id} ---")
        
        # 1. Fetch all UserQueueItem
        stmt = (
            select(UserQueueItem, CampaignLead)
            .join(CampaignLead, UserQueueItem.lead_id == CampaignLead.id)
            .where(UserQueueItem.campaign_id == campaign_id)
            .order_by(desc(UserQueueItem.priority_score))
        )
        result = await session.execute(stmt)
        rows = result.all()
        
        print(f"Found {len(rows)} UserQueue Items:")
        print(f"{'Status':<15} | {'Lead Name':<20} | {'Priority':<10} | {'Call Count'} | {'Next Action'}")
        print("-" * 90)
        
        for item, lead in rows:
            lead_name = lead.customer_name if lead.customer_name else lead.contact_number
            print(f"{item.status:<15} | {lead_name:<20} | {item.priority_score:<10} | {item.user_call_count} | {item.user_call_status}")
            
        # 2. Check for CLOSED items separately if needed
        # (The query above fetches all due to no status filter in my script)
        
        # 3. Check items NOT joined (Orphans)
        stmt_orphans = select(UserQueueItem).where(UserQueueItem.campaign_id == campaign_id)
        all_items = (await session.execute(stmt_orphans)).scalars().all()
        
        if len(all_items) != len(rows):
            print(f"\nWARNING: Mismatch! Total UserQueueItems: {len(all_items)}, Joined: {len(rows)}")
            print("Possible missing Lead records for some QueueItems.")

if __name__ == "__main__":
    # Use the campaign ID observed in previous scripts
    # ff4d88d2-9c17-4da6-90a5-c8eceb976566
    asyncio.run(inspect_user_queue("ff4d88d2-9c17-4da6-90a5-c8eceb976566"))
