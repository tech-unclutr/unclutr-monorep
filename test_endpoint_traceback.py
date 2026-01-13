import asyncio
from dotenv import load_dotenv
import os
load_dotenv("backend/.env")
from sqlmodel import select, text
from app.main import app
from app.models.user import User
from app.api.deps import get_current_active_user
from uuid import UUID

# Mock the user dependency
async def mock_get_current_active_user():
    # We need a user with a company_id
    from sqlmodel import select
    from app.models.integration import Integration
    from app.api.deps import get_db_session
    
    # We can't easily use Depends here in a script without a lot of setup
    # So we'll just return a mock user
    return User(id=UUID("00000000-0000-0000-0000-000000000000"), current_company_id=UUID("00000000-0000-0000-0000-000000000000"))

app.dependency_overrides[get_current_active_user] = mock_get_current_active_user

import httpx
async def test_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
        # Get a real integration_id
        from app.models.integration import Integration
        from app.core.db import engine
        from sqlmodel.ext.asyncio.session import AsyncSession
        
        async with AsyncSession(engine) as session:
            stmt = select(Integration).limit(1)
            res = await session.execute(stmt)
            integration = res.scalars().first()
            if not integration:
                print("No integration found")
                return
            
            # Ensure Dev User exists
            dev_uid = "dev-user-123"
            dev_user_stmt = select(User).where(User.id == dev_uid)
            dev_user = (await session.execute(dev_user_stmt)).scalars().first()
            
            if not dev_user:
                dev_user = User(
                    id=dev_uid,
                    email="dev@unclutr.ai",
                    full_name="Developer User",
                    is_active=True,
                    current_company_id=integration.company_id
                )
                session.add(dev_user)
                await session.commit()
            else:
                # Update current company just in case
                dev_user.current_company_id = integration.company_id
                session.add(dev_user)
                await session.commit()

            # Ensure membership exists for dev user
            from app.models.iam import CompanyMembership
            stmt = select(CompanyMembership).where(
                CompanyMembership.user_id == dev_uid,
                CompanyMembership.company_id == integration.company_id
            )
            res = await session.execute(stmt)
            if not res.scalars().first():
                membership = CompanyMembership(
                    user_id=dev_uid,
                    company_id=integration.company_id,
                    role="owner"
                )
                session.add(membership)
                await session.commit()
            
            # Use SWAGGER_DEV_TOKEN = "secret"
            token = "secret" 
            
            headers = {
                "Authorization": f"Bearer {token}",
                "X-Company-ID": str(integration.company_id)
            }
            
            print(f"Calling /api/v1/integrations/shopify/activity?integration_id={integration.id}")
            response = await ac.get(f"/api/v1/integrations/shopify/activity?integration_id={integration.id}", headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code != 200:
                print(response.text)
            else:
                data = response.json()
                print(f"Success! Found {len(data)} activity logs.")

if __name__ == "__main__":
    asyncio.run(test_endpoint())
