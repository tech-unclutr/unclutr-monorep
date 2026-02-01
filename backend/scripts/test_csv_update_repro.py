
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

async def test_replace_leads():
    async with async_session() as session:
        print("Connected to DB")
        
        # 1. Get latest campaign
        stmt = select(Campaign).order_by(Campaign.created_at.desc()).limit(1)
        result = await session.execute(stmt)
        campaign = result.scalars().first()
        
        if not campaign:
            print("No campaign found to test with.")
            # Create a dummy one
            campaign = Campaign(
                company_id=uuid4(),
                user_id=str(uuid4()),
                name="Test Debug Campaign",
                status="DRAFT",
                phone_number=""
            )
            session.add(campaign)
            await session.commit()
            await session.refresh(campaign)
            print(f"Created temporary campaign: {campaign.id}")
            
        print(f"Testing on campaign: {campaign.id} ({campaign.name})")
        
        # 2. Prepare Leads Data
        leads_data = [
            {
                "campaign_id": campaign.id,
                "customer_name": "Debug User 1",
                "contact_number": "",  # Empty string test
                "cohort": "Debug Cohort",
                "meta_data": {"raw": "data"},
                "status": "PENDING",
                "id": uuid4(),
                "created_at": datetime.utcnow()
            }
        ]
        
        try:
            print("Attempting to delete existing leads...")
            # 1. Delete existing leads
            await session.execute(
                text("DELETE FROM campaign_leads WHERE campaign_id = :campaign_id"),
                {"campaign_id": campaign.id}
            )
            
            print("Attempting to delete goal details...")
            # 2. Delete Goal Details (Analytics)
            await session.execute(
                text("DELETE FROM campaigns_goals_details WHERE campaign_id = :campaign_id"),
                {"campaign_id": campaign.id}
            )
            
            print(f"Attempting to insert {len(leads_data)} new leads...")
            # 3. Insert New Leads using SQLAlchemy Core
            from app.models.campaign_lead import CampaignLead
            # Need to use the table directly for core insert usually, 
            # but SQLModel works as table definition too? 
            # In service it used: `stmt = insert(CampaignLead).values(leads_data)`
            
            stmt = insert(CampaignLead).values(leads_data)
            await session.execute(stmt)
            
            await session.commit()
            print("SUCCESS: Leads replaced successfully.")
            
        except Exception as e:
            print(f"dFAILURE: {e}")
            import traceback
            traceback.print_exc()
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(test_replace_leads())
