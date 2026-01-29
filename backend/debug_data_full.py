import asyncio
import sys
import os
import json

sys.path.append(os.getcwd())

from app.core.db import get_session
from app.models.campaign import Campaign
from sqlalchemy import select

async def main():
    async for session in get_session():
        stmt = select(Campaign).where(Campaign.status == 'COMPLETED')
        result = await session.execute(stmt)
        campaigns = result.scalars().all()
        
        for c in campaigns:
            print(f"ID: {c.id}")
            data = c.bolna_extracted_data or {}
            print(json.dumps(data, indent=2))
        break

if __name__ == "__main__":
    asyncio.run(main())
