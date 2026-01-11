
import asyncio
from sqlalchemy import text
from app.core.db import get_session

async def check_recent():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    print("\n--- Latest Records Recency ---\n")
    
    try:
        # Check shopify_raw_ingest
        result = await session.exec(text("SELECT fetched_at FROM shopify_raw_ingest ORDER BY fetched_at DESC LIMIT 5"))
        rows = result.all()
        print("Latest Shopify Raw Ingest (fetched_at):")
        for row in rows:
            print(f"  - {row[0]}")
            
        # Check shopify_order
        result = await session.exec(text("SELECT shopify_created_at, created_at FROM shopify_order ORDER BY created_at DESC LIMIT 5"))
        rows = result.all()
        print("\nLatest Shopify Orders:")
        for row in rows:
            print(f"  - Shopify Created: {row[0]}, DB Created: {row[1]}")
            
    except Exception as e:
        print(f"Error: {e}")
            
    await session.close()

if __name__ == "__main__":
    asyncio.run(check_recent())
