
import asyncio
from uuid import UUID
from datetime import date, timedelta
from decimal import Decimal
from sqlmodel import select
from app.core.db import async_session_factory
from app.models.shopify.inventory import ShopifyInventoryItem
from app.models.shopify.order import ShopifyOrder
from app.models.shopify.metrics import ShopifyDailyMetric

async def seed_phase2_data():
    BRAND_ID = UUID('bf69769d-d1fc-4d7a-9930-3b92f20500d9')
    INTEGRATION_ID = UUID('66d3876c-b0f4-40b1-a2fc-693533a9a852') # Unclutr Shopify
    
    async with async_session_factory() as session:
        # 1. Seed Cost Data
        stmt = select(ShopifyInventoryItem).where(ShopifyInventoryItem.integration_id == INTEGRATION_ID)
        items = (await session.execute(stmt)).scalars().all()
        print(f"Updating {len(items)} items with mock costs...")
        for i, item in enumerate(items):
            item.cost = Decimal("145.50") if i % 2 == 0 else Decimal("89.00")
            session.add(item)
        
        # 2. Seed Recent Orders to trigger Velocity
        # We need more sales in last 7 days than the 30d baseline avg
        print("Seeding recent orders for velocity boost...")
        for day_offset in range(3):
            target_date = date.today() - timedelta(days=day_offset)
            # Create a daily metric with high sales
            stmt_m = select(ShopifyDailyMetric).where(
                ShopifyDailyMetric.integration_id == INTEGRATION_ID,
                ShopifyDailyMetric.snapshot_date == target_date
            )
            metric = (await session.execute(stmt_m)).scalars().first()
            if metric:
                metric.total_sales = Decimal("5500.00") # High velocity
                session.add(metric)
        
        await session.commit()
        print("🎉 Phase 2 Seed Data Applied.")

if __name__ == "__main__":
    asyncio.run(seed_phase2_data())
