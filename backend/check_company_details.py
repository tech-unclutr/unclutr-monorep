#!/usr/bin/env python3
import asyncio
import uuid
from app.core.db import engine
from app.models.company import Company, Brand
from sqlmodel import select
from sqlalchemy.orm import selectinload

async def check_company():
    company_id = uuid.UUID("a953f1d7-f0a8-49b3-a6f4-c9fbcf774b48")
    print(f"Checking company: {company_id}")
    
    from sqlmodel.ext.asyncio.session import AsyncSession
    async with AsyncSession(engine) as session:
        stmt = select(Company).where(Company.id == company_id).options(selectinload(Company.brands))
        result = await session.exec(stmt)
        company = result.first()
        
        if company:
            print(f"Company Found:")
            print(f"  - Brand Name: '{company.brand_name}'")
            print(f"  - Legal Name: '{company.legal_name}'")
            print(f"  - Brands: {[b.name for b in company.brands]}")
        else:
            print("Company not found.")

if __name__ == "__main__":
    asyncio.run(check_company())
