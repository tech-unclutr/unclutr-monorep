import asyncio
import sys
import os
from uuid import UUID
from sqlalchemy import delete

sys.path.append(os.getcwd())
from app.core.db import async_session_factory
from app.models.campaign import Campaign
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from sqlmodel import select

async def cleanup_queue(campaign_id_str):
    async with async_session_factory() as session:
        campaign_id = UUID(campaign_id_str)
        print(f"Cleaning up campaign {campaign_id}...")
        
        # 1. Delete the "Testing" cohort leads (Phantom leads)
        stmt = select(CampaignLead).where(CampaignLead.campaign_id == campaign_id, CampaignLead.cohort == "Testing")
        leads_to_delete = (await session.execute(stmt)).scalars().all()
        
        if leads_to_delete:
            print(f"Found {len(leads_to_delete)} phantom test leads. Deleting...")
            lead_ids = [l.id for l in leads_to_delete]
            
            # Delete associated Queue Items first (cascade might handle it, but being safe)
            q_del_stmt = delete(QueueItem).where(QueueItem.lead_id.in_(lead_ids))
            await session.execute(q_del_stmt)
            
            for l in leads_to_delete:
                await session.delete(l)
                print(f"Deleted lead: {l.customer_name}")
        else:
            print("No test leads found.")
            
        # 2. Reset "DIALING_INTENT" items to "FAILED" (since they are stuck from 2am)
        # Or mark them COMPLETED if we assume they finished? 
        # User said "call is hanged up, agents work is also finished".
        # So let's mark them as COMPLETED (INTENT_NO or similar) so they don't retry.
        
        stmt = select(QueueItem).where(
            QueueItem.campaign_id == campaign_id, 
            QueueItem.status == "DIALING_INTENT"
        )
        stuck_items = (await session.execute(stmt)).scalars().all()
        
        if stuck_items:
            print(f"Found {len(stuck_items)} stuck DIALING_INTENT items.")
            for item in stuck_items:
                print(f"Marking item {item.id} as COMPLETED (Assumed finished).")
                item.status = "INTENT_UNKNOWN" # Or CONSUMED
                item.outcome = "Manual Cleanup - Assumed Finished"
                session.add(item)
                
        await session.commit()
        print("Cleanup done.")

if __name__ == "__main__":
    asyncio.run(cleanup_queue("ff4d88d2-9c17-4da6-90a5-c8eceb976566"))
