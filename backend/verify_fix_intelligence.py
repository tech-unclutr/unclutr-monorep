
import asyncio
import os
import sys
from uuid import UUID
from unittest.mock import MagicMock, patch
from datetime import datetime

# Set up paths
sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.campaign import Campaign
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from app.services.queue_warmer import QueueWarmer

async def verify_fix():
    campaign_id = UUID("ff4d88d2-9c17-4da6-90a5-c8eceb976566")
    async with async_session_factory() as session:
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            print("Campaign not found")
            return

        # 1. Setup a test QueueItem in READY state
        # Find a READY item or create one
        from sqlalchemy import select
        stmt = select(QueueItem).where(QueueItem.campaign_id == campaign_id, QueueItem.status == "READY").limit(1)
        result = await session.execute(stmt)
        q_item = result.scalars().first()
        
        if not q_item:
            print("No READY queue item found to test with.")
            # Create a mock lead and queue item if needed? 
            # For now let's hope one exists as per previous diagnostic
            return

        # Restore original state if we run multiple times
        q_item.status = "READY"
        q_item.outcome = None
        session.add(q_item)
        await session.commit()
        
        print(f"Testing with QueueItem: {q_item.id}, Status: {q_item.status}")

        # 2. Mock BolnaCaller to return SUCCESS
        mock_results = {
            "status": "success",
            "results": [
                {"status": "success", "call_id": "test-call-id-123"}
            ]
        }

        with patch("app.services.bolna_caller.BolnaCaller.create_and_schedule_batch", return_value=mock_results):
            # We need to bypass the "ACTIVE" check if we want to test _promote_buffer directly
            # Or just set campaign to ACTIVE temporarily
            original_status = campaign.status
            campaign.status = "ACTIVE"
            session.add(campaign)
            await session.flush()

            # Trigger promotion (slots=1)
            print("Triggering promotion with SUCCESS mock...")
            await QueueWarmer._promote_buffer(session, campaign, slots=1)
            
            # Check status
            await session.refresh(q_item)
            print(f"New Status: {q_item.status}, Outcome: {q_item.outcome}")
            
            if q_item.status == "DIALING_INTENT":
                print("✅ SUCCESS: Item stayed in DIALING_INTENT (not incorrectly failed)")
            else:
                print(f"❌ FAILURE: Item status is {q_item.status}")

            # Restore campaign status
            campaign.status = original_status
            session.add(campaign)
            
            # Reset item for real use if needed
            # q_item.status = "READY"
            # session.add(q_item)
            
            await session.commit()

if __name__ == "__main__":
    asyncio.run(verify_fix())
