
import asyncio
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.models.shopify.raw_ingest import ShopifyRawIngest

async def main():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        try:
            log = ShopifyRawIngest(
                integration_id=UUID("30b8ed0a-7204-4c29-9a8d-80073fbcf04b"),
                company_id=UUID("e9664687-0b1a-4643-85e6-ec8c23232155"), # Using a likely valid UUID or fetching it
                shopify_object_id=9999,
                object_type="debug",
                dedupe_key="debug_1",
                dedupe_hash_canonical="debug_1",
                processing_status="pending"
            )
            # Fetch valid IDs first
            from sqlalchemy import text
            res = await session.execute(text("SELECT id, company_id FROM integration LIMIT 1"))
            row = res.first()
            if row:
                log.integration_id = row[0]
                log.company_id = row[1]
            
            session.add(log)
            await session.commit()
            print("Success!")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
