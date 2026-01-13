import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import json

async def get_shopify_integration():
    engine = create_async_engine("postgresql+asyncpg://param@localhost:5432/postgres")
    async with engine.connect() as conn:
        query = """
        SELECT i.id, i.credentials, i.config, ds.slug
        FROM integration i
        JOIN data_source ds ON i.datasource_id = ds.id
        WHERE ds.slug = 'shopify'
        """
        result = await conn.execute(text(query))
        rows = result.fetchall()
        for row in rows:
            print(f"Integration ID: {row[0]}")
            print(f"Slug: {row[3]}")
            print(f"Credentials: {row[1]}")
            # print(f"Config: {row[2]}") # Config might be large

if __name__ == "__main__":
    asyncio.run(get_shopify_integration())
