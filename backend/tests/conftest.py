import pytest
import pytest_asyncio
from httpx import AsyncClient
from app.main import app

@pytest_asyncio.fixture
async def async_client():
    """
    Fixture for async HTTP client against the FastAPI app.
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
