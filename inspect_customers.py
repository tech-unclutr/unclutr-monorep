
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import json

DATABASE_URL = "postgresql+asyncpg://param@localhost:5432/postgres"

async def inspect_pending_customers():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT payload FROM shopify_raw_ingest WHERE object_type = 'customer' AND processing_status = 'pending' LIMIT 1"))
        row = result.first()
        if row:
            print(json.dumps(row[0], indent=2))
        else:
            print("No pending customer records.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(inspect_pending_customers())
