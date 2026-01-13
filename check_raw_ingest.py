
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://param@localhost:5432/postgres"

async def check_raw_ingest_status():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        result = await conn.execute(text("""
            SELECT object_type, processing_status, count(*) 
            FROM shopify_raw_ingest 
            GROUP BY object_type, processing_status
            ORDER BY object_type, processing_status
        """))
        print(f"{'Object Type':<20} | {'Status':<15} | {'Count':<10}")
        print("-" * 50)
        for row in result:
            print(f"{row[0]:<20} | {row[1]:<15} | {row[2]:<10}")

        print("\nChecking for error messages in 'failed' records:")
        error_result = await conn.execute(text("""
            SELECT object_type, error_message, count(*)
            FROM shopify_raw_ingest
            WHERE processing_status = 'failed'
            GROUP BY object_type, error_message
        """))
        for row in error_result:
            print(f"Type: {row[0]}, Error: {row[1]}, Count: {row[2]}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_raw_ingest_status())
