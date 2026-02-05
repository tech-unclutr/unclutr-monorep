import asyncio
from uuid import UUID
from app.core.db import async_session_factory
from app.api.v1.endpoints.execution import get_campaign_realtime_status_internal

async def test_refresh():
    async with async_session_factory() as session:
        campaign_id = UUID('47fe80bc-97bf-4f05-88d1-7852211ef348')
        print("Calling get_campaign_realtime_status_internal (trigger_warmer=False by default)...")
        res = await get_campaign_realtime_status_internal(campaign_id, session)
        print("Response received. Checking if any calls were initiated in logs would be next.")

if __name__ == "__main__":
    asyncio.run(test_refresh())
