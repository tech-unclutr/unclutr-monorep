import asyncio
import os
from contextlib import asynccontextmanager
from app.main import lifespan, app

async def test_startup():
    print("Starting up...")
    try:
        # Force import of all routers to check for init-time crashes
        from app.api.v1.api import api_router
        print(f"Router loaded: {api_router}")
        
        async with lifespan(app):
            print("Startup successful!")
            # Simulate running for a bit
            await asyncio.sleep(2)
            print("Shutting down...")
    except Exception as e:
        print(f"Startup failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Mock environment variables if needed
    if not os.getenv("SHOPIFY_ENCRYPTION_KEY"):
        os.environ["SHOPIFY_ENCRYPTION_KEY"] = "mock_key_for_test"
    
    asyncio.run(test_startup())
