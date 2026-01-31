
import asyncio
import sys
import os

sys.path.append(os.getcwd())

from app.core.db import get_session
from app.models.company import Company
from sqlalchemy.future import select

async def main():
    async for session in get_session():
        stmt = select(Company)
        result = await session.execute(stmt)
        companies = result.scalars().all()
        
        for company in companies:
            if company.brand_context:
                print(f"Clearing brand_context for {company.brand_name}...")
                company.brand_context = None
                session.add(company)
        
        await session.commit()
        print("Done. All brand contexts cleared.")

if __name__ == "__main__":
    asyncio.run(main())
