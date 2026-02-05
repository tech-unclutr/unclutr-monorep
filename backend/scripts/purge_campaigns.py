
import asyncio
import sys
import os
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import get_session

async def purge_all_campaign_data():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    print("⚠️  STARTING GLOBAL CAMPAIGN DATA PURGE ⚠️")
    print("This will delete ALL data from campaigns, leads, logs, and events.")
    print("-" * 50)

    # Tables referencing campaign_id ordered to respect foreign keys
    tables = [
        "campaign_events",
        "campaigns_goals_details",
        "call_logs",
        "call_raw_data",
        "bolna_execution_maps",
        "queue_items",
        "cohorts",
        "campaign_leads",
        "campaigns"
    ]

    try:
        for table in tables:
            print(f"Purging table: {table}...")
            await session.execute(text(f'DELETE FROM "{table}"'))
        
        await session.commit()
        print("-" * 50)
        print("✅ Global campaign data purge complete.")
        
    except Exception as e:
        print(f"❌ Error during purge: {e}")
        await session.rollback()
    
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(purge_all_campaign_data())
