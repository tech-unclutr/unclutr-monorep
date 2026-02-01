
import asyncio
from sqlmodel import select
from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.user import User
from app.models.iam import CompanyMembership
from app.models.company import Company, Brand, Workspace
from app.models.integration import Integration, IntegrationStatus
from uuid import UUID

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
                new_company = Company(
                    name="Dev Company", 
                    slug="dev-company",
                    brand_name="Dev Brand"
                )
                session.add(new_company)
                await session.commit()
                await session.refresh(new_company)
                target_company_id = new_company.id
                
        # 2a. Setup Stable Brand & Integration (CRITICAL for accuracy tests)
        STABLE_BRAND_ID = UUID('bf69769d-d1fc-4d7a-9930-3b92f20500d9')
        STABLE_INT_ID = UUID('66d3876c-b0f4-40b1-a2fc-693533a9a852')
        STABLE_WS_ID = UUID('a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5') # Generated
        
        # Ensure Brand exists
        brand_stmt = select(Brand).where(Brand.id == STABLE_BRAND_ID)
        brand = (await session.exec(brand_stmt)).first()
        if not brand:
            brand = Brand(
                id=STABLE_BRAND_ID,
                name="Stable Dev Brand",
                company_id=target_company_id
            )
            session.add(brand)
            print("Created Stable Brand.")
            
        # Ensure Workspace exists
        ws_stmt = select(Workspace).where(Workspace.id == STABLE_WS_ID)
        workspace = (await session.exec(ws_stmt)).first()
        if not workspace:
            workspace = Workspace(
                id=STABLE_WS_ID,
                name="Stable Workspace",
                brand_id=STABLE_BRAND_ID,
                company_id=target_company_id
            )
            session.add(workspace)
            print("Created Stable Workspace.")

        # Ensure Integration exists
        from app.models.datasource import DataSource
        ds_stmt = select(DataSource).where(DataSource.slug == "shopify").limit(1)
        datasource = (await session.exec(ds_stmt)).first()
        
        int_stmt = select(Integration).where(Integration.id == STABLE_INT_ID)
        integration = (await session.exec(int_stmt)).first()
        if not integration:
            integration = Integration(
                id=STABLE_INT_ID,
                name="Stable Shopify Integration",
                status=IntegrationStatus.ACTIVE,
                company_id=target_company_id,
                workspace_id=STABLE_WS_ID,
                datasource_id=datasource.id if datasource else None,
                metadata_info={"shop": "unclutr-dev.myshopify.com"}
            )
            session.add(integration)
            print("Created Stable Integration.")
            
        await session.commit()
                
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
