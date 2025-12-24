import pytest

@pytest.mark.asyncio
async def test_health_check(async_client):
    """
    Test the basic health check endpoint.
    """
    response = await async_client.get("/api/v1/health/full")
    assert response.status_code == 200
    data = response.json()
    assert "api" in data
    assert data["api"] == "online"
    # we don't assert other fields strictly as they depend on env vars
