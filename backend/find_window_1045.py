
import asyncio
import sys
import os
from sqlalchemy import select
from app.core.db import async_session_factory
from app.models.campaign import Campaign

# Mock specific imports if needed or adjust python path
sys.path.append(os.getcwd())

async def find_campaigns_with_window():
    async with async_session_factory() as session:
        stmt = select(Campaign)
        result = await session.execute(stmt)
        campaigns = result.scalars().all()
        
        found = False
        for c in campaigns:
            if c.execution_windows:
                for w in c.execution_windows:
                    if w.get('start') == '10:45':
                        print(f"FOUND MATCH in Campaign: {c.name}")
                        print(f"ID: {c.id}")
                        print(f"Window: {w}")
                        found = True
        
        if not found:
            print("No campaign found with a window starting at 10:45")

if __name__ == "__main__":
    asyncio.run(find_campaigns_with_window())
