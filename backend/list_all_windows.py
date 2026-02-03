
import asyncio
import sys
import os
from sqlalchemy import select
from app.core.db import async_session_factory
from app.models.campaign import Campaign

sys.path.append(os.getcwd())

async def list_all_windows():
    async with async_session_factory() as session:
        stmt = select(Campaign)
        result = await session.execute(stmt)
        campaigns = result.scalars().all()
        
        for c in campaigns:
            if c.execution_windows:
                print(f"Campaign: {c.name} (ID: {c.id})")
                print(f"  Windows: {c.execution_windows}")

if __name__ == "__main__":
    asyncio.run(list_all_windows())
