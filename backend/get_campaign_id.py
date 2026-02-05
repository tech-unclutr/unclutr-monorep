import asyncio
from app.core.db import async_session_factory
from app.models.campaign import Campaign
from sqlmodel import select

async def get_id():
    async with async_session_factory() as session:
        r = await session.execute(select(Campaign).limit(1))
        campaign = r.scalars().first()
        if campaign:
            print(campaign.id)

if __name__ == "__main__":
    asyncio.run(get_id())
