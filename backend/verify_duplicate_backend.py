import asyncio
import uuid
import datetime
from datetime import timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from sqlalchemy import desc
import os
import sys

# Add app to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.campaign import Campaign
from app.models.company import Company
from app.models.user import User
from app.core.config import settings

# Use project settings
DATABASE_URL = settings.DATABASE_URL

async def verify_duplicate_detection():
    print(f"Connecting to DB: {DATABASE_URL}")
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    # Test Data
    test_hash = "test_hash_" + str(uuid.uuid4())
    
    async with async_session() as session:
        # 1. Fetch Context (Company & User)
        print("Fetching existing Company and User for context...")
        stmt_company = select(Company).limit(1)
        res_company = await session.execute(stmt_company)
        company = res_company.scalars().first()
        
        stmt_user = select(User).limit(1)
        res_user = await session.execute(stmt_user)
        user = res_user.scalars().first()
        
        if not company or not user:
            print("ERROR: Could not find a Company or User in the database to link to.")
            return

        company_id = company.id
        user_id = user.id
        print(f"Using Company: {company_id}, User: {user_id}")

        # 2. Create Dummy Campaign
        print(f"Creating Dummy Campaign with hash: {test_hash}")
        campaign = Campaign(
            company_id=company_id,
            user_id=user_id,
            name="Test Duplicate Campaign",
            status="DRAFT",
            source_file_hash=test_hash,
            created_at=datetime.datetime.utcnow()
        )
        session.add(campaign)
        await session.commit()
        await session.refresh(campaign)
        print(f"Created Campaign {campaign.id}")

        # 3. Perform Duplicate Check (Logic from intelligence.py)
        # Check for campaigns with same hash created in last 24 hours
        print("Performing Duplicate Check...")
        one_day_ago = datetime.datetime.utcnow() - timedelta(days=1)
        stmt = select(Campaign).where(
            Campaign.company_id == company_id,
            Campaign.source_file_hash == test_hash,
            Campaign.created_at >= one_day_ago
        ).order_by(desc(Campaign.created_at)).limit(1)
        
        result = await session.execute(stmt)
        existing_campaign = result.scalars().first()

        # 4. Assertions
        if existing_campaign:
            print(f"SUCCESS: Duplicate detected! ID: {existing_campaign.id}")
            if existing_campaign.id == campaign.id:
                 print("Correctly identified the campaign we just created as a collision.")
            else:
                 print(f"Found a different campaign? {existing_campaign.id}")
        else:
             print("FAILURE: Duplicate NOT detected. Logic or query invalid.")

        # 5. Cleanup
        print("Cleaning up...")
        await session.delete(campaign)
        await session.commit()
        print("Cleanup done.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(verify_duplicate_detection())
