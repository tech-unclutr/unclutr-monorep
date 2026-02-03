import asyncio
from sqlmodel import select
from app.core.db import get_session
from app.models.campaign import Campaign
from datetime import datetime

async def check_timestamps():
    async for session in get_session():
        try:
            stmt = select(Campaign).order_by(Campaign.created_at.desc()).limit(10)
            result = await session.execute(stmt)
            campaigns = result.scalars().all()
            
            print("\n=== Recent Campaigns Timestamp Analysis ===\n")
            for campaign in campaigns:
                same = campaign.created_at == campaign.updated_at
                time_diff = (campaign.updated_at - campaign.created_at).total_seconds() if not same else 0
                age_hours = (datetime.utcnow() - campaign.created_at).total_seconds() / 3600
                
                print(f"Campaign: {campaign.name[:50]}")
                print(f"  ID: {campaign.id}")
                print(f"  Created:  {campaign.created_at}")
                print(f"  Updated:  {campaign.updated_at}")
                print(f"  Same timestamps: {same}")
                print(f"  Time diff: {time_diff} seconds")
                print(f"  Age: {age_hours:.1f} hours ago")
                print(f"  Status: {campaign.status}")
                print()
                
        finally:
            break

if __name__ == "__main__":
    asyncio.run(check_timestamps())
