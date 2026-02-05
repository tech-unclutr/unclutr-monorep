import asyncio
from uuid import UUID
from app.core.db import async_session_factory
from app.services.queue_warmer import QueueWarmer
from app.models.campaign import Campaign

async def test_warmer():
    async with async_session_factory() as session:
        campaign_id = UUID('ff4d88d2-9c17-4da6-90a5-c8eceb976566')
        
        # Ensure campaign is in ACTIVE state for warmer to promote
        campaign = await session.get(Campaign, campaign_id)
        if campaign:
            original_status = campaign.status
            campaign.status = "ACTIVE"
            session.add(campaign)
            await session.commit()
            print(f"Campaign set to ACTIVE (was {original_status})")
        
        print(f"Triggering QueueWarmer.check_and_replenish for {campaign_id}...")
        try:
            await QueueWarmer.check_and_replenish(campaign_id, session)
            print("Warmer execution finished.")
        except Exception as e:
            print(f"Warmer execution failed as expected or unexpected: {e}")

if __name__ == "__main__":
    asyncio.run(test_warmer())
