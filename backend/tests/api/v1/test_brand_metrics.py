import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_brand_overview_endpoint(
    async_client: AsyncClient,
    normal_user_token_headers: dict,
    db_session
):
    """
    Test the Bird's Eye overview endpoint.
    Requires at least one brand/company to be present.
    """
    # 1. Fetch a valid brand ID (from Company)
    # We first fetch the company associated with the user.
    # We'll use the authenticated user to find their company.
    
    # Actually, simpler: create a mock Brand/Company in DB fixture if possible, 
    # but for integration test against running DB, we'll try to discover one.
    
    # We can try to list companies via existing API or just create one using DB session.
    from app.models.company import Brand, Company
    from app.models.user import User
    from sqlmodel import select
    import uuid
    
    # Create test data
    brand_id = uuid.uuid4()
    company_id = uuid.uuid4()
    
    company = Company(id=company_id, brand_name="Test Corp", currency="USD")
    brand = Brand(id=brand_id, company_id=company_id, name="Test Brand")
    
    db_session.add(company)
    db_session.add(brand)
    await db_session.commit()
    
    # 2. Call endpoint
    response = await async_client.get(
        f"/api/v1/metrics/brand/{brand_id}/overview",
        headers=normal_user_token_headers
    )
    
    # 3. Assertions
    assert response.status_code == 200
    data = response.json()
    assert "heartbeat" in data
    assert "revenue" in data["heartbeat"]
    assert "shopify_pulse" in data
    assert data["shopify_pulse"]["status"] in ["active", "inactive", "error"]
