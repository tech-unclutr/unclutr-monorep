import asyncio
from app.core.db import engine
from app.core.config import settings

async def check_db():
    print(f"Config DATABASE_URL: {settings.DATABASE_URL}")
    print(f"Actual Engine URL: {engine.url}")
    
    # Try a simple connection to see if it works
    try:
        async with engine.connect() as conn:
            print("Successfully connected to database!")
            # Check version
            result = await conn.execute("SELECT version();")
            version = result.scalar()
            print(f"Database Version: {version}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
