import pytest
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime
from app.main import app
from app.models.campaign import Campaign
from app.models.user import User
from app.models.company import Company
from app.models.iam import CompanyMembership, SystemRole
from app.api.deps import get_session
from app.core.config import settings
import pytest_asyncio
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from sqlalchemy.future import select

@pytest_asyncio.fixture
async def db_session():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

@pytest.mark.asyncio
async def test_campaign_filtering(db_session: AsyncSession):
    """
    Test that temporary drafts are filtered out from list_campaigns.
    """
    # 1. Use the hardcoded dev-user-123 from security.py
    user_id = "dev-user-123"
    company_id = uuid4()
    
    # Ensure user exists in DB
    user = await db_session.get(User, user_id)
    if not user:
        user = User(
            id=user_id,
            email="dev@unclutr.ai",
            full_name="Developer User",
            is_active=True
        )
        db_session.add(user)
        
    # Create a test company
    company = Company(
        id=company_id, 
        brand_name="Filter Test Brand",
        currency="USD"
    )
    db_session.add(company)
    
    # Create membership for dev-user-123 to this company
    membership = CompanyMembership(
        user_id=user_id,
        company_id=company_id,
        role=SystemRole.ADMIN
    )
    db_session.add(membership)
    
    # 2. Create "Temporary Draft" (should be hidden)
    temp_draft = Campaign(
        id=uuid4(),
        company_id=company_id,
        user_id=user_id,
        name=f"Campaign - {datetime.utcnow().strftime('%B %d, %Y')}",
        status="DRAFT",
        brand_context=None,
        customer_context=None
    )
    
    # 3. Create a "Real Draft" (should be visible)
    real_draft = Campaign(
        id=uuid4(),
        company_id=company_id,
        user_id=user_id,
        name="Real Draft Campaign",
        status="DRAFT",
        brand_context="Some brand",
        customer_context="Some customer"
    )
    
    # 4. Create an "Initiated Campaign" (should be visible)
    initiated_campaign = Campaign(
        id=uuid4(),
        company_id=company_id,
        user_id=user_id,
        name="Initiated Campaign",
        status="INITIATED"
    )

    db_session.add_all([temp_draft, real_draft, initiated_campaign])
    await db_session.commit()

    # Override dependencies
    app.dependency_overrides[get_session] = lambda: db_session
    
    headers = {
        "X-Company-ID": str(company_id),
        "Authorization": f"Bearer {settings.SWAGGER_DEV_TOKEN}"
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 5. Fetch campaigns
        response = await client.get("/api/v1/intelligence/campaigns", headers=headers)
        
        if response.status_code != 200:
            print(f"DEBUG Error Response: {response.status_code} - {response.content}")
        
        assert response.status_code == 200
        data = response.json()
        campaigns = data.get("campaigns", [])
        campaign_ids = [c["id"] for c in campaigns]

        # 6. Verify results
        assert str(temp_draft.id) not in campaign_ids, f"Temporary draft {temp_draft.id} should be filtered out"
        assert str(real_draft.id) in campaign_ids, f"Real draft {real_draft.id} should be visible"
        assert str(initiated_campaign.id) in campaign_ids, f"Initiated campaign {initiated_campaign.id} should be visible"

    # Cleanup test data (optional but good)
    # await db_session.delete(temp_draft)
    # await db_session.delete(real_draft)
    # await db_session.delete(initiated_campaign)
    # await db_session.commit()

    # Cleanup overrides
    app.dependency_overrides = {}
    print("✅ Campaign filtering test passed!")
