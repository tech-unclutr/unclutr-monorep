import sys
import os
import asyncio
from sqlalchemy import select, delete

# Add logical path components
sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.campaign import Campaign

async def main():
    async with async_session_factory() as session:
        # ID of the empty duplicate campaign
        duplicate_id = "32d20f71-cd6a-456a-8c5b-b150e790f51d"
        
        stmt = select(Campaign).where(Campaign.id == duplicate_id)
        result = await session.execute(stmt)
        campaign = result.scalar_one_or_none()

        if campaign:
            print(f"Deleting duplicate campaign: {campaign.name} (ID: {campaign.id})")
            await session.delete(campaign)
            await session.commit()
            print("Successfully deleted.")
        else:
            print("Duplicate campaign not found.")

if __name__ == "__main__":
    asyncio.run(main())
