import asyncio
from sqlmodel import select
from app.core.db import AsyncSession, engine
from app.models.campaign import Campaign

async def check_campaign_sync():
    async with AsyncSession(engine) as session:
        stmt = select(Campaign).order_by(Campaign.created_at.desc())
        result = await session.execute(stmt)
        campaigns = result.scalars().all()
        
        print(f"Found {len(campaigns)} campaigns")
        for cp in campaigns[:5]:
            print(f"ID: {cp.id}")
            print(f"Name: {cp.name}")
            print(f"Status: {cp.status}")
            print(f"Execution Windows: {cp.execution_windows}")
            # print(f"Last Synced: {cp.meta_data.get('last_calendar_sync') if cp.meta_data else 'Never'}")
            print("-" * 20)

if __name__ == "__main__":
    asyncio.run(check_campaign_sync())
