
import asyncio
from uuid import UUID
from app.core.db import async_session_factory, engine
from app.models.campaign import Campaign
from app.schemas.campaign import CampaignSettingsUpdate
from sqlalchemy import select

async def test_save():
    async with async_session_factory() as session:
        # Find a test campaign
        stmt = select(Campaign).limit(1)
        result = await session.execute(stmt)
        campaign = result.scalars().first()
        
        if not campaign:
            print("No campaign found to test with")
            return

        print(f"Testing save for campaign: {campaign.id}")
        
        # Mock settings update
        settings = CampaignSettingsUpdate(
            execution_windows=[
                {"day": "2026-02-01", "start": "09:00", "end": "11:00"}
            ]
        )
        
        update_data = settings.dict(exclude_unset=True)
        print(f"Update data: {update_data}")
        
        for key, value in update_data.items():
            setattr(campaign, key, value)
            
        try:
            session.add(campaign)
            await session.commit()
            print("Save successful!")
        except Exception as e:
            print(f"Save failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_save())
