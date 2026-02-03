import asyncio
from uuid import UUID
from app.core.db import async_session_factory
from app.models.campaign import Campaign
from app.models.company import Company
from sqlalchemy import select

CAMPAIGN_ID = "7b277bac-9157-4c01-9b6e-3b28b088e0b4"

async def check_campaign():
    print(f"Checking for campaign ID: {CAMPAIGN_ID}")
    
    async with async_session_factory() as session:
        # Check if campaign exists globally
        stmt = select(Campaign).where(Campaign.id == UUID(CAMPAIGN_ID))
        result = await session.execute(stmt)
        campaign = result.scalar_one_or_none()
        
        if not campaign:
            print("❌ Campaign NOT found in the database.")
            
            # Additional check: list all campaigns to see if there's a typo or partial match?
            # Or just count to verify DB is accessible
            stmt_all = select(Campaign.id, Campaign.name).limit(5)
            result_all = await session.execute(stmt_all)
            rows = result_all.all()
            print("\nRecent campaigns found (verification of DB connection):")
            for row in rows:
                print(f" - {row.id}: {row.name}")
                
        else:
            print(f"✅ Campaign FOUND.")
            print(f" - Name: {campaign.name}")
            print(f" - Status: {campaign.status}")
            print(f" - Company ID: {campaign.company_id}")
            
            # Check Company
            stmt_company = select(Company).where(Company.id == campaign.company_id)
            result_company = await session.execute(stmt_company)
            company = result_company.scalar_one_or_none()
            
            if company:
                print(f"✅ Linked Company Found: {company.name} ({company.id})")
            else:
                print(f"❌ Linked Company ({campaign.company_id}) NOT found.")

if __name__ == "__main__":
    asyncio.run(check_campaign())
