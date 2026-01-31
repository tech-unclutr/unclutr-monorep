import asyncio
from app.core.db import get_session
from app.models.company import Company
from sqlmodel import select

async def main():
    async for session in get_session():
        stmt = select(Company)
        result = await session.execute(stmt)
        companies = result.scalars().all()
        print(f"Found {len(companies)} companies:")
        for c in companies:
            print(f"ID: {c.id}, Name: {c.brand_name}")
        break

if __name__ == "__main__":
    asyncio.run(main())
