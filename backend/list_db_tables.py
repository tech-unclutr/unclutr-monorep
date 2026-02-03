import asyncio
import sys
import os
from sqlalchemy import text

# Add app to path
sys.path.append(os.getcwd())

from app.core.db import get_session

async def list_tables():
    session_gen = get_session()
    session = await session_gen.__anext__()
    try:
        # Get all table names in public schema
        result = await session.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
        tables = [t[0] for t in result.all()]
        print("Existing Tables:")
        for t in sorted(tables):
            print(t)
            
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        await session.close()
        try:
            await session_gen.aclose()
        except:
            pass

if __name__ == "__main__":
    asyncio.run(list_tables())
