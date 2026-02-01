import sys
import os
import asyncio
from sqlalchemy import select

# Add logical path components
sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.archived_campaign import ArchivedCampaign

async def main():
    async with async_session_factory() as session:
        print("--- LISTING ARCHIVED CAMPAIGNS ---")
        stmt = select(ArchivedCampaign)
        result = await session.execute(stmt)
        campaigns = result.scalars().all()

        print(f"Total Archived Campaigns: {len(campaigns)}")
        for i, c in enumerate(campaigns):
            print(f"{i+1}. Name: {c.name} | Original ID: {c.original_campaign_id} | Archived At: {c.archived_at}")
            print(f"   Company ID: {c.company_id}")

if __name__ == "__main__":
    asyncio.run(main())
