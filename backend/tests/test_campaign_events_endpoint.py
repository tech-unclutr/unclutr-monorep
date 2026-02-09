import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from app.main import app
from app.models.campaign_event import CampaignEvent
from app.api.deps import get_session, get_current_active_user

@pytest.fixture
def mock_session():
    session = AsyncMock()
    session.execute = AsyncMock()
    return session

@pytest.mark.asyncio
async def test_get_lead_campaign_events_mocked(mock_session):
    # Mock the dependency
    app.dependency_overrides[get_session] = lambda: mock_session
    app.dependency_overrides[get_current_active_user] = lambda: MagicMock()

    campaign_id = uuid4()
    lead_id = uuid4()
    
    # Mock the DB result
    mock_event = CampaignEvent(
        id=uuid4(),
        campaign_id=campaign_id,
        lead_id=lead_id,
        event_type="thought",
        message="System thinking...",
        agent_name="Agent Zero",
        created_at=MagicMock()
    )
    mock_event.created_at.isoformat.return_value = "2026-02-06T12:00:00"
    
    mock_result = MagicMock()
    mock_result.scalars().all.return_value = [mock_event]
    mock_session.execute.return_value = mock_result

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Mock get_current_user_no_depends to avoid actual token verification in middleware
        with patch("app.middleware.tenant_middleware.get_current_user_no_depends", return_value={"uid": "user-123"}):
            # Also need to mock the DB check for membership in the middleware
            mock_membership = MagicMock()
            mock_membership.role = "admin"
            
            # This is tricky because the middleware creates its own session.
            # I'll just skip the middleware by adding the path to public_paths TEMPORARILY in the test if possible,
            # but modifying the code is better. 
            # REST OF THE TEST...
            
            headers = {
                "Authorization": "Bearer dummy",
                "X-Company-ID": str(uuid4())
            }
            
            # Override CompanyMembership query in the middleware's session
            # Since I can't easily reach the middleware's session, I'll patch async_session_factory
            with patch("app.middleware.tenant_middleware.async_session_factory") as mock_factory:
                mock_db = AsyncMock()
                mock_factory.return_value.__aenter__.return_value = mock_db
                
                mock_membership_res = MagicMock()
                mock_membership_res.scalars().first.return_value = mock_membership
                mock_db.execute.return_value = mock_membership_res
                
                response = await client.get(
                    f"/api/v1/execution/campaign/{campaign_id}/lead/{lead_id}/events",
                    headers=headers
                )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["message"] == "System thinking..."
    assert data[0]["type"] == "thought"
    
    # Clean up overrides
    app.dependency_overrides = {}
