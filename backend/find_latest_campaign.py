
import asyncio
import os
import sys
from sqlalchemy.future import select
from sqlalchemy import desc

# Set up paths
sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.campaign import Campaign

async def find_latest_campaign():
    async with async_session_factory() as session:
        stmt = select(Campaign).order_by(desc(Campaign.updated_at)).limit(5)
        result = await session.execute(stmt)
        campaigns = result.scalars().all()
        
        for c in campaigns:
            print(f"ID: {c.id} | Name: {c.name} | Status: {c.status} | Updated: {c.updated_at}")

if __name__ == "__main__":
    asyncio.run(find_latest_campaign())
