import asyncio
from uuid import UUID
from datetime import date, timedelta, datetime
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
        print("Seeding recent orders for velocity boost...")
        from app.models.company import Brand
        brand = (await session.execute(select(Brand).where(Brand.id == BRAND_ID))).scalars().first()
        
        for day_offset in range(5):
            target_date = date.today() - timedelta(days=day_offset)
            target_datetime = datetime.combine(target_date, datetime.min.time())
            
            # Create a real order
            order = ShopifyOrder(
                integration_id=INTEGRATION_ID,
                company_id=brand.company_id,
                shopify_order_id=1000 + day_offset,
                shopify_order_number=1000 + day_offset,
                shopify_name=f"#100{day_offset}",
                financial_status="paid",
                total_price=Decimal("1500.00"),
                subtotal_price=Decimal("1500.00"),
                currency="INR",
                shopify_created_at=target_datetime,
                shopify_updated_at=target_datetime,
                created_by="SeedScript",
                updated_by="SeedScript"
            )
            session.add(order)

            # Create/Update daily metric
            stmt_m = select(ShopifyDailyMetric).where(
                ShopifyDailyMetric.integration_id == INTEGRATION_ID,
                ShopifyDailyMetric.snapshot_date == target_date
            )
            metric = (await session.execute(stmt_m)).scalars().first()
            if not metric:
                metric = ShopifyDailyMetric(
                    integration_id=INTEGRATION_ID,
                    company_id=brand.company_id,
                    snapshot_date=target_date,
                    total_sales=Decimal("1500.00"),
                    order_count=1,
                    created_by="SeedScript",
                    updated_by="SeedScript"
                )
            else:
                metric.total_sales = Decimal("1500.00")
            session.add(metric)
        
        await session.commit()
        print("🎉 Phase 2 Seed Data Applied (Orders & Metrics).")

if __name__ == "__main__":
    asyncio.run(seed_phase2_data())
