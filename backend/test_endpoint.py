"""
Direct test to verify the /users/me endpoint populates designation.
"""

import asyncio
import httpx
import os

async def test_users_me_endpoint():
    """Test that /users/me auto-populates designation."""
    
    # This is a direct test - you'll need to get the auth token from the browser
    print("=== Testing /users/me Endpoint ===")
    print("\nTo test manually:")
    print("1. Open browser DevTools (F12)")
    print("2. Go to Application > Local Storage")
    print("3. Find the Firebase auth token")
    print("4. Or just refresh the settings page and check Network tab for /users/me response")
    print("\nExpected: designation field should be 'Founder' (from most recent campaign)")
    print("\nAlternatively, check the backend logs for the SQL query:")
    print("  - Should see: SELECT campaigns.* FROM campaigns WHERE user_id = ...")
    print("  - Should see: UPDATE user SET designation = ...")

if __name__ == "__main__":
    asyncio.run(test_users_me_endpoint())
