
import sys
import os
import asyncio
from fastapi.testclient import TestClient

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.core.security import get_current_user

# Mock auth
async def mock_get_current_user():
    return {"uid": "test_user_id", "email": "test@example.com"}

app.dependency_overrides[get_current_user] = mock_get_current_user

client = TestClient(app)

def test_datasources():
    print("Testing /api/v1/datasources...")
    
    # 1. Fetch all
    response = client.get("/api/v1/datasources/")
    if response.status_code != 200:
        print(f"FAILED: {response.status_code} - {response.text}")
        return
        
    data = response.json()
    print(f"Total datasources fetched: {len(data)}")
    if len(data) == 0:
        print("WARNING: No datasources found. Is DB seeded?")
    
    # Check flags
    common = [d for d in data if d['is_common']]
    print(f"Common datasources: {len(common)}")
    
    # 2. Filter by category
    response_cat = client.get("/api/v1/datasources/?category=Storefront")
    cat_data = response_cat.json()
    print(f"Storefronts fetched: {len(cat_data)}")
    
    # 3. Filter by is_common
    response_common = client.get("/api/v1/datasources/?is_common=true")
    common_data = response_common.json()
    print(f"Filtered Common fetched: {len(common_data)}")
    
    if len(common_data) == 13:
        print("SUCCESS: 13 common datasources found as expected.")
    else:
        print(f"FAILED: Expected 13 common, got {len(common_data)}")

if __name__ == "__main__":
    test_datasources()
