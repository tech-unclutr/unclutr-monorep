
import asyncio
from app.core.db import async_session_factory
from sqlmodel import select
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem
from app.models.user_queue_item import UserQueueItem

async def main():
    async with async_session_factory() as session:
        print("Checking for Leads that are PENDING but have CLOSED QueueItems...")
        
        # 1. Find inconsistencies
        # Leads that are PENDING
        leads_result = await session.execute(
            select(CampaignLead).where(CampaignLead.status == "PENDING")
        )
        leads = leads_result.scalars().all()
        
        fixed_count = 0
        
        for lead in leads:
            # Check if there is a QueueItem for this lead that is CLOSED
            q_result = await session.execute(
                select(QueueItem).where(
                    QueueItem.lead_id == lead.id,
                    QueueItem.status == "CLOSED"
                )
            )
            q_item = q_result.scalar_one_or_none()
            
            if q_item:
                print(f"Found Stale Lead: {lead.id} (Name: {lead.customer_name})")
                print(f"  - Associated QueueItem is CLOSED (Reason: {q_item.closure_reason})")
                
                # Check if it was promoted?
                if q_item.promoted_to_user_queue:
                    # If promoted, check UserQueueItem status
                    uq_result = await session.execute(
                        select(UserQueueItem).where(UserQueueItem.lead_id == lead.id)
                    )
                    uq_item = uq_result.scalar_one_or_none()
                    if uq_item and uq_item.status == "CLOSED":
                        print("  - UserQueueItem is also CLOSED. Fixing Lead status -> PROCESSED")
                        lead.status = "PROCESSED"
                        session.add(lead)
                        fixed_count += 1
                    elif uq_item:
                        print(f"  - UserQueueItem is {uq_item.status}. Lead should remain PENDING/OPEN.")
                    else:
                        # Promoted but no UserQueueItem? Weird.
                        print("  - Promoted but no UserQueueItem found. Investigating...")
                else:
                    # Not promoted, just Closed (Rejected by AI)
                    print("  - Not promoted. Fixing Lead status -> PROCESSED")
                    lead.status = "PROCESSED"
                    session.add(lead)
                    fixed_count += 1
        
        if fixed_count > 0:
            await session.commit()
            print(f"Successfully fixed {fixed_count} stale leads.")
        else:
            print("No stale leads found.")

if __name__ == "__main__":
    asyncio.run(main())
