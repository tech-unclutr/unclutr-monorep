
import asyncio
import sys
import os

sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from app.models.user import User

async def main():
    async_session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    target_user_id = "QrOwZmlu4ycKYdaUMz09rh0CoCc2" 
    
    async with async_session_factory() as session:
        print(f"--- Checking User {target_user_id} ---")
        user = await session.get(User, target_user_id)
        if user:
            print(f"User Found.")
            print(f"Current Company ID: {user.current_company_id}")
            
            if user.current_company_id:
                # Check membership
                from app.models.iam import CompanyMembership
                ms = await session.execute(
                    select(CompanyMembership).where(
                        CompanyMembership.user_id == target_user_id,
                        CompanyMembership.company_id == user.current_company_id
                    )
                )
                membership = ms.scalars().first()
                if membership:
                    print(f"Membership Found: ID={membership.id}, Role={membership.role}")
                else:
                    print("CRITICAL: Membership MISSING for current_company_id!")
    
            target_ghost_id = "017ac5e1-78fc-438f-813f-ffc9acc18c14"
            print(f"\n--- Checking Ghost Company {target_ghost_id} ---")
            from app.models.company import Company
            ghost_company = await session.get(Company, target_ghost_id)
            if ghost_company:
                print(f"Ghost Company Found! Name: {ghost_company.brand_name}")
            else:
                print("Ghost Company NOT FOUND in DB.")

            if not user.current_company_id:
                print("Confirmed: current_company_id is None/Null")
        else:
            print("User not found.")

if __name__ == "__main__":
    asyncio.run(main())
