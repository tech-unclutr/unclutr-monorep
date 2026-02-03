import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.user import User
from app.models.company import Company
from app.models.iam import CompanyMembership, SystemRole
from app.models.campaign import Campaign
from app.api.deps import get_current_active_user, get_session
from uuid import uuid4
import pytest_asyncio
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.core.config import settings

@pytest_asyncio.fixture
async def db_session():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

@pytest.mark.asyncio
async def test_duplicate_csv_upload(db_session: AsyncSession):
    # Setup - Use Dev Token logic
    user_id = "dev-user-123" 
    company_id = uuid4()
    
    # 1. Create User (if doesn't exist from other tests, or just create unique one)
    # Using firebase UID matching dev token
    existing_user = await db_session.get(User, user_id)
    if not existing_user:
        user = User(
            id=user_id,
            email=f"dev_{uuid4()}@unclutr.ai",
            full_name="Developer User",
            is_active=True
        )
        db_session.add(user)
    else:
        user = existing_user
    
    # 2. Create Company with required brand_name
    company = Company(
        id=company_id, 
        brand_name="Test Brand", # Critical: brand_name is required
        currency="USD"
    )
    db_session.add(company)
    
    # 3. Create Membership
    membership = CompanyMembership(
        user_id=user_id,
        company_id=company_id,
        role=SystemRole.ADMIN
    )
    db_session.add(membership)
    await db_session.commit()

    # Override dependencies
    app.dependency_overrides[get_session] = lambda: db_session
    # Note: We don't override get_current_active_user because we use the real dev token
    # which the middleware and security layer understand.
    
    headers = {
        "X-Company-ID": str(company_id),
        "Authorization": f"Bearer {settings.SWAGGER_DEV_TOKEN}"
    }
    
    payload = {
        "campaign_name": "Test Campaign 1",
        "leads": [
            {"customer_name": "Alice", "contact_number": "+1234567890"},
            {"customer_name": "Bob", "contact_number": "+1987654321"}
        ]
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: First Upload
        response = await client.post(
            "/api/v1/intelligence/campaigns/create-from-csv",
            json=payload,
            headers=headers
        )
        
        if response.status_code != 200:
            print(f"DEBUG Error 1: {response.status_code} - {response.content}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        campaign_id_1 = data["campaign_id"]
        
        # Step 2: Duplicate Upload
        response = await client.post(
            "/api/v1/intelligence/campaigns/create-from-csv",
            json=payload,
            headers=headers
        )
        
        assert response.status_code == 409
        data = response.json()
        assert data["code"] == "DUPLICATE_UPLOAD"
        assert data["campaign_id"] == campaign_id_1
        
        # Step 3: Force Create
        payload["force_create"] = True
        response = await client.post(
            "/api/v1/intelligence/campaigns/create-from-csv",
            json=payload,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        campaign_id_2 = data["campaign_id"]
        assert campaign_id_2 != campaign_id_1

    # Cleanup overrides
    app.dependency_overrides = {}
