
import asyncio
from uuid import UUID
from sqlalchemy import select
from app.core.db import async_session_factory
from app.models.campaign import Campaign

async def inspect_campaign(campaign_id_str):
    campaign_id = UUID(campaign_id_str)
    async with async_session_factory() as session:
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            print(f"Campaign {campaign_id} not found")
            return
        
        print(f"Campaign ID: {campaign.id}")
        print(f"Status: {campaign.status}")
        print(f"Execution Windows: {campaign.execution_windows}")
        print(f"Meta Data: {campaign.meta_data}")

if __name__ == "__main__":
    import sys
    campaign_id = sys.argv[1] if len(sys.argv) > 1 else "7b277bac-9157-4648-971c-43f1ae75d862"
    asyncio.run(inspect_campaign(campaign_id))
