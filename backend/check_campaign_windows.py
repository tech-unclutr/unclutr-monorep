import asyncio
from uuid import UUID
from sqlmodel import select
from app.core.db import init_db, get_session
from app.models.campaign import Campaign

async def check_campaign():
    await init_db()
    async for session in get_session():
        # Get latest campaign
        stmt = select(Campaign).order_by(Campaign.created_at.desc()).limit(1)
        result = await session.execute(stmt)
        campaign = result.scalars().first()
        
        if campaign:
            print(f"Campaign Found: {campaign.id}")
            print(f"Name: {campaign.name}")
            print(f"Execution Windows: {campaign.execution_windows}")
            print(f"Number of windows: {len(campaign.execution_windows or [])}")
        else:
            print("No campaigns found.")
        break

if __name__ == "__main__":
    asyncio.run(check_campaign())
