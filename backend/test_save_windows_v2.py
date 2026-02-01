
import asyncio
import sys
import os
from uuid import UUID
from datetime import datetime

# Set up PYTHONPATH
sys.path.append(os.getcwd())

from app.core.db import async_session_factory, engine
from app.models.campaign import Campaign
from app.schemas.campaign import CampaignSettingsUpdate
from sqlalchemy import select

async def test_save():
    print("Starting test_save...")
    try:
        async with async_session_factory() as session:
            # Find a test campaign
            stmt = select(Campaign).limit(1)
            result = await session.execute(stmt)
            campaign = result.scalars().first()
            
            if not campaign:
                print("No campaign found to test with")
                return

            print(f"Testing save for campaign: {campaign.id}")
            print(f"Current windows: {campaign.execution_windows}")
            
            # Mock settings update
            # We use a unique value for start time to verify it's saved
            unique_time = datetime.now().strftime("%H:%M")
            settings = CampaignSettingsUpdate(
                execution_windows=[
                    {"day": "2026-02-01", "start": unique_time, "end": "23:59"}
                ]
            )
            
            update_data = settings.dict(exclude_unset=True)
            print(f"Update data from settings: {update_data}")
            
            for key, value in update_data.items():
                print(f"Setting {key} = {value} (type: {type(value)})")
                setattr(campaign, key, value)
                
            print("Attempting to commit...")
            session.add(campaign)
            await session.commit()
            print("Commit successful!")
            
            # Refresh and check
            await session.refresh(campaign)
            print(f"Verified windows after reload: {campaign.execution_windows}")
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("Test finished.")

if __name__ == "__main__":
    asyncio.run(test_save())
