import asyncio
import sys
import os

sys.path.append(os.getcwd())

from app.core.db import get_session
from app.models.campaign import Campaign
from app.services.intelligence.campaign_service import campaign_service
from sqlalchemy import select

async def main():
    async for session in get_session():
        print("Fetching COMPLETED campaigns...")
        stmt = select(Campaign).where(Campaign.status == 'COMPLETED')
        result = await session.execute(stmt)
        campaigns = result.scalars().all()
        
        print(f"Found {len(campaigns)} campaigns to update.")
        
        for campaign in campaigns:
            print(f"Processing Campaign {campaign.id} ({campaign.name})...")
            
            # Get Extracted Data
            data = campaign.bolna_extracted_data or {}
            
            # Recalculate Score
            # We call the internal method directly or we can use the public update method
            # Let's use the internal calculation logic we just fixed
            score, gap = campaign_service._calculate_quality_score(data)
            
            print(f"  Old Score: {campaign.quality_score}")
            print(f"  New Score: {score}")
            print(f"  Gap: {gap}")
            
            # Update DB
            campaign.quality_score = score
            campaign.quality_gap = gap
            session.add(campaign)
            
        await session.commit()
        print("Updates committed.")
        break

if __name__ == "__main__":
    asyncio.run(main())
