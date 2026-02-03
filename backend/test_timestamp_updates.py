"""
Test script to verify campaign timestamp behavior after implementing automatic updates.
"""
import asyncio
from sqlmodel import select
from app.core.db import get_session
from app.models.campaign import Campaign
from datetime import datetime
import time

async def test_timestamp_updates():
    """Test that timestamps are updated correctly on campaign modifications."""
    async for session in get_session():
        try:
            print("\n=== Testing Campaign Timestamp Updates ===\n")
            
            # 1. Get a recent campaign
            stmt = select(Campaign).order_by(Campaign.created_at.desc()).limit(1)
            result = await session.execute(stmt)
            campaign = result.scalars().first()
            
            if not campaign:
                print("❌ No campaigns found in database")
                return
            
            print(f"Testing with campaign: {campaign.name}")
            print(f"  ID: {campaign.id}")
            print(f"  Created:  {campaign.created_at}")
            print(f"  Updated:  {campaign.updated_at}")
            
            original_updated_at = campaign.updated_at
            
            # 2. Wait a moment to ensure timestamp difference
            print("\n⏳ Waiting 2 seconds before update...")
            await asyncio.sleep(2)
            
            # 3. Update the campaign (modify a field)
            print("\n📝 Updating campaign name...")
            old_name = campaign.name
            campaign.name = f"{campaign.name} (Updated)"
            
            session.add(campaign)
            await session.commit()
            await session.refresh(campaign)
            
            print(f"\n✅ Campaign updated!")
            print(f"  Name changed: '{old_name}' → '{campaign.name}'")
            print(f"  Created:  {campaign.created_at}")
            print(f"  Updated:  {campaign.updated_at}")
            
            # 4. Verify updated_at changed
            time_diff = (campaign.updated_at - original_updated_at).total_seconds()
            print(f"\n📊 Timestamp Analysis:")
            print(f"  Original updated_at: {original_updated_at}")
            print(f"  New updated_at:      {campaign.updated_at}")
            print(f"  Time difference:     {time_diff:.2f} seconds")
            
            if time_diff >= 2:
                print(f"\n✅ SUCCESS: updated_at was automatically updated!")
                print(f"   The event listener is working correctly.")
            else:
                print(f"\n⚠️  WARNING: updated_at did not change significantly")
                print(f"   Expected at least 2 seconds difference, got {time_diff:.2f}")
            
            # 5. Restore original name
            print(f"\n🔄 Restoring original name...")
            campaign.name = old_name
            session.add(campaign)
            await session.commit()
            print(f"   Restored to: '{campaign.name}'")
            
        finally:
            break

if __name__ == "__main__":
    asyncio.run(test_timestamp_updates())
