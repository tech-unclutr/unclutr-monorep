
import asyncio
import sys
import os

# Add the backend directory to sys.path to allow importing app components
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from app.core.db import async_session_factory

async def nuke_campaign_data():
    tables = [
        "campaign_events",
        "bolna_execution_maps",
        "queue_items",
        "call_logs",
        "call_raw_data",
        "campaigns_goals_details",
        "campaign_leads",
        "cohorts",
        "campaigns",
        "archived_campaign_leads",
        "archived_campaigns"
    ]
    
    async with async_session_factory() as session:
        print("🚀 Starting campaign data nuke...")
        
        try:
            for table in tables:
                print(f"🧹 Clearing {table}...")
                await session.execute(text(f"DELETE FROM {table}"))
            
            await session.commit()
            print("✨ Successfully cleared all campaign related data.")
            print("✅ Database is now fresh for a new campaign.")
            
        except Exception as e:
            print(f"❌ Error during nuke: {e}")
            await session.rollback()
            raise e

if __name__ == "__main__":
    asyncio.run(nuke_campaign_data())
