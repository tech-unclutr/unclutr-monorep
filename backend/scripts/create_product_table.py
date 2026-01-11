import asyncio
import os
import sys
from sqlalchemy import text
from sqlmodel import SQLModel

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.db import engine
from app.models.shopify.product import ShopifyProduct

async def create_tables():
    async with engine.begin() as conn:
        print("🚀 Creating ShopifyProduct table...")
        # Since we are using SQLModel, we can use create_all but we want to be targeted
        await conn.run_sync(SQLModel.metadata.create_all, tables=[ShopifyProduct.__table__])
        print("✅ ShopifyProduct table created.")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv("backend/.env")
    asyncio.run(create_tables())
