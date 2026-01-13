import asyncio
from sqlalchemy import func, select, text
from app.core.db import async_session_factory
from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.models.shopify.order import ShopifyOrder
from app.models.shopify.product import ShopifyProduct
from app.models.shopify.customer import ShopifyCustomer
from app.models.shopify.inventory import ShopifyInventoryLevel
from app.models.shopify.financials import ShopifyPayout, ShopifyDispute
from app.models.shopify.checkout import ShopifyCheckout
from app.models.shopify.marketing import ShopifyMarketingEvent
from app.models.shopify.discount import ShopifyPriceRule

async def check_counts():
    async with async_session_factory() as session:
        # Check Raw Ingest Counts by Object Type
        print("--- Raw Ingest Counts by Object Type ---")
        stmt = select(ShopifyRawIngest.object_type, func.count(ShopifyRawIngest.id)).group_by(ShopifyRawIngest.object_type)
        result = await session.execute(stmt)
        for row in result.all():
            print(f"{row[0]}: {row[1]}")

        # Check Refined Table Counts
        print("\n--- Refined Table Counts ---")
        tables = {
            "Orders": ShopifyOrder,
            "Products": ShopifyProduct,
            "Customers": ShopifyCustomer,
            "Inventory Levels": ShopifyInventoryLevel,
            "Payouts": ShopifyPayout,
            "Disputes": ShopifyDispute,
            "Checkouts": ShopifyCheckout,
            "Marketing Events": ShopifyMarketingEvent,
            "Price Rules": ShopifyPriceRule
        }
        
        for name, model in tables.items():
            try:
                count = (await session.execute(select(func.count(model.id)))).scalar_one()
                print(f"{name}: {count}")
            except Exception as e:
                print(f"{name}: Error/Empty ({e})")



        # Check for Reports if they exist in raw ingest or separate table
        # We don't have a refined ShopifyReport table imported above, but let's check raw ingest 'report' type which we did.

if __name__ == "__main__":
    asyncio.run(check_counts())
