import asyncio
from app.core.db import async_session_factory
from app.models.campaign import Campaign
from sqlmodel import select
from uuid import UUID

async def get_cid():
    async with async_session_factory() as session:
        campaign_id = UUID('47fe80bc-97bf-4f05-88d1-7852211ef348')
        r = await session.execute(select(Campaign).where(Campaign.id == campaign_id))
        campaign = r.scalars().first()
        if campaign:
            print(campaign.company_id)

if __name__ == "__main__":
    asyncio.run(get_cid())
