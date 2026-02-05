import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.db import get_session
from app.services import auth_service
from app.models.user import UserCreate

async def reproduce():
    print("Starting reproduction...")
    try:
        # Mock user data
        user_in = UserCreate(
            id="test_uid_123",
            email="test@example.com",
            full_name="Test User",
            picture_url="http://example.com/pic.jpg"
        )
        
        # Get session manually
        async for session in get_session():
            print("Got DB session.")
            try:
                print("Attempting sync_user...")
                user = await auth_service.sync_user(session, user_in)
                print(f"Sync successful: {user}")
            except Exception as e:
                print(f"Caught exception during sync: {e}")
                import traceback
                traceback.print_exc()
            finally:
                await session.close()
            break # Just need one session
            
    except Exception as e:
        print(f"Setup failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(reproduce())
