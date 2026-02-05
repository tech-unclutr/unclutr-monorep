#!/usr/bin/env python3
"""Test the auth sync endpoint directly"""
import asyncio
import sys
from app.core.db import get_session
from app.services import auth_service
from app.models.user import UserCreate

async def test_sync():
    print("Testing auth sync...")
    
    # Create a test user
    user_in = UserCreate(
        id="QrOwZmlu4ycKYdaUMz09rh0CoCc2",
        email="tech.unclutr@gmail.com",
        full_name="Test User",
        picture_url=None
    )
    
    try:
        async for session in get_session():
            print(f"Session created: {session}")
            print(f"Calling sync_user...")
            user = await auth_service.sync_user(session, user_in)
            print(f"✓ Success! User synced: {user.email}")
            print(f"  - ID: {user.id}")
            print(f"  - Onboarding completed: {user.onboarding_completed}")
            print(f"  - Current company ID: {user.current_company_id}")
            break
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_sync())
