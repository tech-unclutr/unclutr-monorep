
import asyncio
from datetime import datetime
from app.core.db import async_session_factory
from sqlmodel import select
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem
from app.models.user_queue_item import UserQueueItem
from app.services.user_queue_warmer import UserQueueWarmer

async def main():
    async with async_session_factory() as session:
        # 1. Get the lead "Param"
        lead_id = 'e8d87cf5-024a-4dd3-8682-fbb7ffd69055' # Param
        
        print(f"--- Force Promoting Lead {lead_id} ---")
        
        # Get QueueItem
        q_result = await session.execute(select(QueueItem).where(QueueItem.lead_id == lead_id))
        q_item = q_result.scalar_one_or_none()
        
        if not q_item:
            print("QueueItem not found!")
            return

        print(f"Current QueueItem Status: {q_item.status}")
        
        # Check if UserQueueItem already exists
        uq_result = await session.execute(select(UserQueueItem).where(UserQueueItem.lead_id == lead_id))
        uq_item = uq_result.scalar_one_or_none()
        
        if uq_item:
            print(f"UserQueueItem already exists! Status: {uq_item.status}")
            if uq_item.status == "CLOSED":
                print("Re-opening UserQueueItem...")
                uq_item.status = "PENDING"
                session.add(uq_item)
        else:
            print("Creating UserQueueItem...")
            await UserQueueWarmer.promote_to_user_queue(session, q_item.id)
            print("Promoted via Warmer.")
            
        # Update QueueItem to reflect agreement
        if q_item.status != "INTENT_YES":
            print("Updating QueueItem status to INTENT_YES")
            q_item.status = "INTENT_YES"
            q_item.outcome = "Agreed (Manual Fix)"
            q_item.promoted_to_user_queue = True
            q_item.closure_reason = None # Clear "NO_INTENT"
            session.add(q_item)
            
        await session.commit()
        print("Success! Lead should now be in User Queue.")

if __name__ == "__main__":
    asyncio.run(main())
