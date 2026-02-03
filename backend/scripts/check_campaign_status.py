import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import select
from app.core.db import async_session_factory
from app.models.campaign import Campaign

async def main():
    async with async_session_factory() as session:
        print("[*] --- Campaign Status Check ---")
        stmt = select(Campaign)
        res = await session.execute(stmt)
        campaigns = res.scalars().all()
        
        for c in campaigns:
            print(f"ID: {c.id} | Name: '{c.name}' | Status: {c.status} | Company: {c.company_id}")

if __name__ == "__main__":
    asyncio.run(main())
