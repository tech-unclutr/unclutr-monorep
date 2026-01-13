
import asyncio
from sqlmodel import select
from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.user import User
from app.models.iam import CompanyMembership
from app.models.company import Company

async def setup_dev_user():
    async with AsyncSession(engine) as session:
        dev_uid = "dev-user-123"
        print(f"Setting up Dev User: {dev_uid}")
        
        # 1. Get or Create User
        stmt = select(User).where(User.id == dev_uid)
        dev_user = (await session.exec(stmt)).first()
        
        if not dev_user:
            dev_user = User(
                id=dev_uid,
                email="dev@unclutr.ai",
                full_name="Developer User",
                is_active=True,
                is_superuser=True
            )
            session.add(dev_user)
            print("Created Dev User.")
        else:
            print("Dev User already exists.")
            
        await session.commit()
        await session.refresh(dev_user)
        
        # 2. Find a Company to attach to
        # Try to find the company associated with the active integration first
        from app.models.integration import Integration
        int_stmt = select(Integration).where(Integration.status == "active").limit(1)
        integration = (await session.exec(int_stmt)).first()
        
        target_company_id = None
        if integration:
            target_company_id = integration.company_id
            print(f"Found active integration company: {target_company_id}")
        else:
            # Fallback to any company
            comp_stmt = select(Company).limit(1)
            company = (await session.exec(comp_stmt)).first()
            if company:
                target_company_id = company.id
                print(f"Fallback to first company: {target_company_id}")
            else:
                print("No company found! Creating one...")
                new_company = Company(name="Dev Company", slug="dev-company")
                session.add(new_company)
                await session.commit()
                await session.refresh(new_company)
                target_company_id = new_company.id
                
        # 3. Create Membership
        mem_stmt = select(CompanyMembership).where(
            CompanyMembership.user_id == dev_uid, 
            CompanyMembership.company_id == target_company_id
        )
        membership = (await session.exec(mem_stmt)).first()
        
        if not membership:
            membership = CompanyMembership(
                user_id=dev_uid,
                company_id=target_company_id,
                role="owner"
            )
            session.add(membership)
            print(f"Created membership for company {target_company_id}")
        else:
            print("Membership already exists.")
            
        # 4. Set current company on user
        dev_user.current_company_id = target_company_id
        session.add(dev_user)
        await session.commit()
        print("Updated user current_company_id.")
        
        print(f"SETUP COMPLETE. Use Token: 'secret' and X-Company-ID: '{target_company_id}'")

if __name__ == "__main__":
    asyncio.run(setup_dev_user())
