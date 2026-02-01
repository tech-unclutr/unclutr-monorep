import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.company import Company

async def check_companies():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Company))
        companies = result.scalars().all()
        
        for company in companies:
            print(f'ID: {company.id}')
            print(f'Company Name: {company.company_name}')
            print(f'Brand Name: {company.brand_name}')
            print(f'Email: {company.email}')
            print('---')

if __name__ == "__main__":
    asyncio.run(check_companies())
