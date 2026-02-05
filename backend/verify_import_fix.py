
import asyncio
import os
import sys
from uuid import UUID
from unittest.mock import MagicMock, patch
from datetime import datetime
import httpx

# Set up paths
sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.campaign import Campaign
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from app.services.bolna_caller import BolnaCaller

async def verify_bolna_caller_import():
    campaign_id = UUID("ff4d88d2-9c17-4da6-90a5-c8eceb976566")
    async with async_session_factory() as session:
        # 1. Get a lead and queue item
        from sqlalchemy import select
        lead_stmt = select(CampaignLead).where(CampaignLead.campaign_id == campaign_id).limit(1)
        lead = (await session.execute(lead_stmt)).scalars().first()
        
        if not lead:
            print("No lead found to test with")
            return
            
        q_stmt = select(QueueItem).where(QueueItem.lead_id == lead.id).limit(1)
        q_item = (await session.execute(q_stmt)).scalars().first()
        
        if not q_item:
            # Create a mock queue item if none exists
            q_item = QueueItem(id=UUID("00000000-0000-0000-0000-000000000000"), campaign_id=campaign_id, lead_id=lead.id, status="READY")
            session.add(q_item)
            await session.flush()

        print(f"Verifying BolnaCaller with lead {lead.id}...")
        
        # 2. Mock network calls inside create_and_schedule_batch
        # We want to see if it reaches the part where it uses User without crashing
        
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_post.return_value = MagicMock(status_code=200, json=lambda: {"status": "success", "execution_id": "test-execution-id"})
            
            try:
                # We also need to mock Ngrok check since it's slow/fails in isolation
                with patch("httpx.AsyncClient.get", return_value=MagicMock(status_code=404)):
                    results = await BolnaCaller.create_and_schedule_batch(
                        session=session,
                        campaign_id=campaign_id,
                        lead_ids=[lead.id],
                        queue_item_ids=[q_item.id]
                    )
                    print(f"Results: {results}")
                    print("✅ SUCCESS: BolnaCaller executed without NameError (User import fixed)")
            except Exception as e:
                import traceback
                print(f"❌ FAILURE: BolnaCaller crashed: {e}")
                traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_bolna_caller_import())
