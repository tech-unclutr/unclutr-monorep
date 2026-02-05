
import asyncio
from uuid import UUID
from sqlalchemy import select
from app.core.db import async_session_factory
from app.models.company import Company
from app.models.iam import CompanyMembership, SystemRole
from app.models.user import User

async def fix_dev_membership():
    async with async_session_factory() as session:
        # 1. Ensure dev-user-123 exists
        dev_user_id = "dev-user-123"
        user = await session.get(User, dev_user_id)
        if not user:
            print(f"Creating User {dev_user_id}...")
            user = User(
                id=dev_user_id,
                email="dev@unclutr.ai",
                full_name="Developer User",
                is_active=True
            )
            session.add(user)
        else:
            print(f"User {dev_user_id} exists.")

        # 2. Find a target company
        stmt = select(Company).limit(1)
        res = await session.execute(stmt)
        company = res.scalars().first()
        
        if not company:
            print("No companies found! Cannot add membership.")
            return

        print(f"Target Company: {company.id} ({company.brand_name})")

        # 3. Check/Add Membership
        stmt = select(CompanyMembership).where(
            CompanyMembership.user_id == dev_user_id, 
            CompanyMembership.company_id == company.id
        )
        res = await session.execute(stmt)
        existing = res.scalars().first()
        
        if not existing:
            print("Adding membership...")
            mem = CompanyMembership(
                user_id=dev_user_id,
                company_id=company.id,
                role=SystemRole.ADMIN
            )
            session.add(mem)
            await session.commit()
            print("Membership added.")
        else:
            print("Membership already exists.")

if __name__ == "__main__":
    asyncio.run(fix_dev_membership())
