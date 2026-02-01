import sys
import os
import asyncio
from sqlalchemy import select

# Add logical path components
sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.campaign import Campaign

async def main():
    async with async_session_factory() as session:
        print("--- LISTING ALL CAMPAIGNS ---")
        stmt = select(Campaign)
        result = await session.execute(stmt)
        campaigns = result.scalars().all()

        print(f"Total Campaigns in DB: {len(campaigns)}")
        for i, c in enumerate(campaigns):
            print(f"{i+1}. Name: {c.name} | ID: {c.id} | Status: {c.status}")
            print(f"   Company ID: {c.company_id} | User ID: {c.user_id}")
            print(f"   Created: {c.created_at}")

if __name__ == "__main__":
    asyncio.run(main())
