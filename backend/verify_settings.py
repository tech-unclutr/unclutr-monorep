import asyncio
from httpx import AsyncClient
from app.main import app
from app.core.security import get_current_user

# Mock auth to avoid token issues during test
async def mock_get_current_user():
    return {"uid": "QrOwZmlu4ycKYdaUMz09rh0CoCc2"}

app.dependency_overrides[get_current_user] = mock_get_current_user

async def verify_settings_fallback():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        print("Testing /api/v1/settings/onboarding ...")
        response = await ac.get("/api/v1/settings/onboarding")
        if response.status_code == 200:
            data = response.json()
            print("Response Data:")
            print(f"Channels: {data.get('channels')}")
            print(f"Stack: {data.get('stack')}")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)

if __name__ == "__main__":
    asyncio.run(verify_settings_fallback())
    # Clean up
    del app.dependency_overrides[get_current_user]
