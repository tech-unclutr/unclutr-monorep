import asyncio
from sqlmodel import select, func
from sqlalchemy.orm import sessionmaker
from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.shopify.order import ShopifyOrder
from app.models.shopify.inventory import ShopifyInventoryLevel
from app.models.shopify.raw_ingest import ShopifyRawIngest

async_session_factory = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def verify_stress_results():
    async with async_session_factory() as session:
        # 1. Count refined orders from stress test
        stmt = select(func.count(ShopifyOrder.id)).where(ShopifyOrder.shopify_name.like("#STRESS-%"))
        count = (await session.execute(stmt)).scalar()
        print(f"📊 Refined Stress Orders: {count}/20")

        # 2. Check inventory levels for the stress item
        # inventory_item_id = 8880001
        inv_stmt = select(ShopifyInventoryLevel).where(ShopifyInventoryLevel.shopify_inventory_item_id == 8880001)
        levels = (await session.execute(inv_stmt)).scalars().all()
        print(f"📍 Inventory Levels for 8880001: {len(levels)}")
        for l in levels:
            print(f"   - Location {l.shopify_location_id}: {l.available} units")

        # 3. Check raw ingestion counts
        raw_stmt = select(func.count(ShopifyRawIngest.id)).where(ShopifyRawIngest.source == "webhook")
        raw_count = (await session.execute(raw_stmt)).scalar()
        print(f"📥 Total Raw Webhooks Ingested: {raw_count}")

if __name__ == "__main__":
    asyncio.run(verify_stress_results())
