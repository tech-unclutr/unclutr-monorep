
import asyncio
import sys
import os

# Add backend to pythonpath
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.db import engine
from app.services import onboarding_service
from app.models.user import User
from app.models.company import Company
from app.models.iam import CompanyMembership
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload, sessionmaker

async def main():
    async_session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session_factory() as session:
        # 1. Fetch any user
        print("Fetching users...")
        result = await session.exec(select(User))
        users = result.all()
        
        if not users:
            print("No users found.")
            return

        print(f"Found {len(users)} users.")
        
        for user in users:
            print(f"--- Checking User: {user.email} ({user.id}) ---")
            
            # Check Company Membership
            stmt = select(CompanyMembership).where(CompanyMembership.user_id == user.id)
            res = await session.exec(stmt)
            mem = res.first()
            
            if not mem:
                print("  No company membership.")
                continue
                
            print(f"  Belongs to Company ID: {mem.company_id}")
            
            # Check Company Data
            stmt = select(Company).where(Company.id == mem.company_id).options(selectinload(Company.brands))
            res = await session.exec(stmt)
            company = res.first()
            
            if not company:
                print("  Company record not found!")
                continue
                
            print(f"  Company Name: '{company.legal_name}'")
            print(f"  Brand Name:   '{company.brand_name}'")
            print(f"  Industry:     '{company.industry}'")
            print(f"  Country:      '{company.country}'")
            print(f"  Currency:     '{company.currency}'")
            print(f"  Timezone:     '{company.timezone}'") # Ensure this is stored
            
            # Attempt Sync Logic (Dry Run)
            print("  [Simulating Sync...]")
            
            brand_name = company.brand_name
            if company.brands and len(company.brands) > 0:
                brand_name = company.brands[0].name
                
            basics = {
                "companyName": company.legal_name or company.brand_name,
                "brandName": brand_name,
                "category": company.industry,
                "region": {
                    "country": company.country,
                    "currency": company.currency,
                    "timezone": company.timezone
                }
            }
            print(f"  Generated Basics Data: {basics}")
            
            if not basics.get("companyName"):
                print("  WARNING: companyName is Empty!")
            else:
                print("  SUCCESS: Data looks valid for prefill.")

if __name__ == "__main__":
    asyncio.run(main())
