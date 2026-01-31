
import asyncio
import uuid
import sys
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

# Add current dir to path to find app module
sys.path.append(os.getcwd())

from app.core.config import settings
from app.models.campaign import Campaign
from app.services.intelligence.campaign_service import CampaignService

async def test_delete():
    print(f"Connecting to DB: {settings.DATABASE_URL}")
    engine = create_async_engine(str(settings.DATABASE_URL))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("--- Testing DB Access ---")
        
        # 1. Try to fetch any campaign to verify read access
        stmt = select(Campaign).limit(1)
        result = await session.execute(stmt)
        campaign = result.scalar_one_or_none()
        
        if campaign:
            print(f"Found existing campaign: {campaign.id} (Company: {campaign.company_id})")
        else:
            print("No campaigns found in DB.")
            
        # 2. Test deletion of non-existent campaign
        service = CampaignService()
        fake_id = uuid.uuid4()
        fake_company = uuid.uuid4()
        
        print(f"Attempting to delete fake campaign: {fake_id}")
        result = await service.delete_campaign(session, fake_id, fake_company)
        print(f"Result (Expected False): {result}")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_delete())
