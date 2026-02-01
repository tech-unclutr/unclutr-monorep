import sys
import os
import asyncio
from sqlalchemy import select, text

# Add logical path components
sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.campaign import Campaign

async def main():
    async with async_session_factory() as session:
        print("--- RAW COUNT ---")
        # Raw SQL to bypass any model filtering quirks
        res = await session.execute(text("SELECT count(*) FROM campaigns"))
        count = res.scalar()
        print(f"Row count in 'campaigns' table: {count}")
        
        print("\n--- ALL CAMPAIGNS (SQLAlchemy) ---")
        stmt = select(Campaign)
        result = await session.execute(stmt)
        campaigns = result.scalars().all()
        
        for c in campaigns:
            print(f"ID: {c.id}")
            print(f"Name: {c.name}")
            print(f"User ID: {c.user_id}")
            print(f"Company ID: {c.company_id}")
            print(f"Status: {c.status}")
            print("-------------------")

if __name__ == "__main__":
    asyncio.run(main())
