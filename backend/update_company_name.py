import asyncio
from sqlalchemy import select, create_engine
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models.company import Company
from app.core.config import settings

async def update_company_name():
    engine = create_async_engine(str(settings.DATABASE_URL))
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as db:
        # Get all companies
        result = await db.execute(select(Company))
        companies = result.scalars().all()
        
        print("Current companies:")
        for i, company in enumerate(companies, 1):
            print(f'{i}. ID: {company.id}, Brand: {company.brand_name}, Company: {company.company_name}, Email: {company.email}')
        
        if not companies:
            print("No companies found!")
            return
        
        # Update the company with "Acme"
        company_to_update = None
        for company in companies:
            if company.brand_name == "Acme" or company.company_name == "Acme":
                company_to_update = company
                break
        
        if not company_to_update and companies:
            # If no "Acme" found, update the first company
            company_to_update = companies[0]
        
        if company_to_update:
            print(f"\nUpdating company ID {company_to_update.id}...")
            new_brand_name = input("Enter new brand name: ").strip()
            if new_brand_name:
                company_to_update.brand_name = new_brand_name
                
            new_company_name = input("Enter new company name (or press Enter to skip): ").strip()
            if new_company_name:
                company_to_update.company_name = new_company_name
            
            await db.commit()
            print(f"✅ Updated! Brand: {company_to_update.brand_name}, Company: {company_to_update.company_name}")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update_company_name())
