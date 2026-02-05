
import asyncio
import os
import sys
from uuid import UUID
from sqlalchemy.future import select

# Set up paths
sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.campaign import Campaign

async def list_campaigns():
    async with async_session_factory() as session:
        stmt = select(Campaign)
        result = await session.execute(stmt)
        campaigns = result.scalars().all()
        print(f"Total Campaigns: {len(campaigns)}")
        for c in campaigns:
            print(f"{c.id} | {c.name} | {c.status}")

if __name__ == "__main__":
    asyncio.run(list_campaigns())
