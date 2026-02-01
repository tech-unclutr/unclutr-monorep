import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
import os
import sys

# Add app to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.campaign import Campaign
from app.models.archived_campaign import ArchivedCampaign
from app.core.config import settings

# Use project settings
DATABASE_URL = settings.DATABASE_URL

async def test_lookup():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Test existing campaign
        result = await session.execute(select(Campaign).limit(1))
        campaign = result.scalars().first()
        
        if campaign:
            print(f"PASS: Found existing campaign {campaign.id}")
            
            # 2. Test non-existent random ID
            random_id = uuid.uuid4()
            found_random = await session.get(Campaign, random_id)
            if not found_random:
                print(f"PASS: Correctly did not find random ID {random_id}")
            else:
                print(f"FAIL: Found random ID {random_id}??")
                
            # 3. Test Archived check logic
            archived = await session.get(ArchivedCampaign, random_id)
            if not archived:
                print(f"PASS: Correctly did not find random ID {random_id} in ArchivedCampaign")
        else:
            print("INFO: No campaigns found in DB to test with existing ID")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_lookup())
