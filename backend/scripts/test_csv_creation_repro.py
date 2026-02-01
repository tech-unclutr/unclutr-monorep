
import asyncio
import uuid
from typing import List
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, select, insert
from datetime import datetime
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.core.config import settings
from uuid import uuid4

# Setup DB connection
DATABASE_URL = settings.DATABASE_URL
engine = create_async_engine(DATABASE_URL, echo=True, future=True)
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def test_create_campaign_flow():
    async with async_session() as session:
        print("Connected to DB")
        
        # 1. Check schemas
        print("Checking campaigns columns...")
        result = await session.execute(text("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'campaigns'"))
        columns = result.all()
        for col in columns:
            print(f" - {col[0]}: {col[1]}")
            
        # 2. Simulate default creation
        print("\nSimulating create_campaign_from_csv...")
        
        try:
            campaign_id = uuid4()
            company_id = uuid4() # Dummy company
            user_id = str(uuid4()) # Dummy user
            
            campaign = Campaign(
                id=campaign_id,
                company_id=company_id,
                user_id=user_id,
                name=f"Test Campaign {datetime.utcnow()}",
                status="DRAFT",
                phone_number=""
            )
            
            session.add(campaign)
            await session.flush()
            print(f"Campaign flushed: {campaign.id}")
            
            # 3. Insert Leads
            leads_data = [
                 {
                    "id": uuid4(),
                    "campaign_id": campaign.id,
                    "customer_name": "New User 1",
                    "contact_number": "+123456",
                    "cohort": "Test",
                    "meta_data": {},
                    "status": "PENDING",
                    "created_at": datetime.utcnow()
                }
            ]
            
            stmt = insert(CampaignLead).values(leads_data)
            await session.execute(stmt)
            
            await session.commit()
            print("SUCCESS: Campaign and Leads created.")
            
        except Exception as e:
            print(f"FAILURE: {e}")
            import traceback
            traceback.print_exc()
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(test_create_campaign_flow())
