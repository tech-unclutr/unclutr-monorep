import asyncio
from app.core.db import get_session
from app.models.company import Company
from uuid import UUID

async def main():
    company_id = UUID("28233392-a23b-4f2d-b051-fb9d8cc7c97b")
    async for session in get_session():
        c = await session.get(Company, company_id)
        if c:
            print(f"Name: {c.brand_name}")
            print(f"Tagline: {c.tagline}")
            print(f"Tags (raw): {c.tags}") 
        break

if __name__ == "__main__":
    asyncio.run(main())
