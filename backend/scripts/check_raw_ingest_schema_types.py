import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check_schema():
    engine = create_async_engine("postgresql+asyncpg://param@localhost:5432/postgres")
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'shopify_raw_ingest'"))
        columns = result.fetchall()
        for col in columns:
            print(f"{col[0]}: {col[1]}")

if __name__ == "__main__":
    asyncio.run(check_schema())
