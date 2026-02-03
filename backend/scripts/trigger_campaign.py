
import asyncio
import sys
import os
from uuid import UUID
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.core.db import get_session
from app.models.campaign import Campaign
from app.services.queue_warmer import QueueWarmer

async def trigger_campaign(campaign_id_str: str):
    campaign_id = UUID(campaign_id_str)
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    print(f"🚀 Triggering campaign: {campaign_id}")

    try:
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            print(f"❌ Campaign {campaign_id} not found.")
            return

        campaign.status = "ACTIVE"
        session.add(campaign)
        await session.commit()
        print(f"✅ Campaign status set to ACTIVE.")

        print("🔥 Running QueueWarmer.check_and_replenish...")
        await QueueWarmer.check_and_replenish(campaign_id, session)
        print("✅ Warmer run complete.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        await session.rollback()
    finally:
        await session.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python trigger_campaign.py <campaign_id>")
        sys.exit(1)
    
    asyncio.run(trigger_campaign(sys.argv[1]))
