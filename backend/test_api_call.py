#!/usr/bin/env python3
import asyncio
import sys
from uuid import UUID
from app.core.db import async_session_factory
from app.models.campaign import Campaign
from sqlalchemy import select

async def test_api_update():
    """Simulate what the API endpoint does"""
    async with async_session_factory() as session:
        # Get first campaign
        stmt = select(Campaign).limit(1)
        result = await session.execute(stmt)
        campaign = result.scalars().first()
        
        if not campaign:
            print("No campaign found")
            return
            
        print(f"Campaign ID: {campaign.id}")
        print(f"Current execution_windows: {campaign.execution_windows}")
        
        # Simulate the update_data from Pydantic
        update_data = {
            "execution_windows": [
                {"day": "2026-02-01", "start": "09:00", "end": "11:00"}
            ]
        }
        
        print(f"\nAttempting to set execution_windows...")
        print(f"Type of value: {type(update_data['execution_windows'])}")
        print(f"Value: {update_data['execution_windows']}")
        
        try:
            for key, value in update_data.items():
                print(f"\nSetting {key} = {value}")
                setattr(campaign, key, value)
            
            print("\nCommitting...")
            session.add(campaign)
            await session.commit()
            print("SUCCESS!")
            
            await session.refresh(campaign)
            print(f"Verified: {campaign.execution_windows}")
            
        except Exception as e:
            print(f"\nERROR: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_api_update())
