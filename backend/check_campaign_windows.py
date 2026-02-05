
import asyncio
import os
import sys
from uuid import UUID
from datetime import datetime
import pytz

# Set up paths
sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.campaign import Campaign

async def check_campaign_windows(campaign_id_str):
    campaign_id = UUID(campaign_id_str)
    async with async_session_factory() as session:
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            print(f"Campaign {campaign_id} not found")
            return
            
        print(f"Campaign: {campaign.name}")
        print(f"Status: {campaign.status}")
        print(f"Windows: {campaign.execution_windows}")
        
        now_local = datetime.now()
        print(f"Current Local Time: {now_local}")
        
        if campaign.execution_windows:
            for w in campaign.execution_windows:
                day = w.get('day', '')
                st = w.get('start', '')
                et = w.get('end', '')
                print(f"Checking Window: {day} {st} - {et}")
                if day and st and et:
                    try:
                        start_dt = datetime.fromisoformat(f"{day}T{st}:00")
                        end_dt = datetime.fromisoformat(f"{day}T{et}:00")
                        print(f"  Parsed: {start_dt} - {end_dt}")
                        if start_dt <= now_local <= end_dt:
                            print("  Status: ACTIVE")
                        else:
                            print("  Status: INACTIVE")
                    except Exception as e:
                        print(f"  Error: {e}")

if __name__ == "__main__":
    campaign_id = "ff4d88d2-9c17-4da6-90a5-c8eceb976566"
    asyncio.run(check_campaign_windows(campaign_id))
