
import asyncio
import sys
import os
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import get_session

async def check_schema():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    tables = [
        'archived_campaign_leads',
        'campaign_leads', 
        'campaigns_goals_details',
        'archived_campaigns',
        'audit_trail',
        'all_requests'
    ]
    
    for table in tables:
        print(f"\n--- {table} ---")
        res = await session.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'"))
        cols = res.fetchall()
        for col in cols:
            print(f"  {col[0]}")

    await session.close()

if __name__ == "__main__":
    asyncio.run(check_schema())
