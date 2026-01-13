import asyncio
import os
import sys
from sqlmodel import delete, select
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.db import engine
from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.models.shopify.order import ShopifyOrder, ShopifyLineItem
from app.models.shopify.customer import ShopifyCustomer
from app.models.shopify.transaction import ShopifyTransaction
from app.models.shopify.refund import ShopifyRefund
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant, ShopifyProductImage
from app.models.shopify.inventory import ShopifyLocation, ShopifyInventoryItem, ShopifyInventoryLevel
from app.models.shopify.address import ShopifyAddress
from app.models.shopify.analytics import ShopifyReport, ShopifyReportData, ShopifyAnalyticsSnapshot
from app.models.shopify.financials import ShopifyPayout, ShopifyDispute, ShopifyBalanceTransaction
from app.models.shopify.metrics import ShopifyDailyMetric
from app.models.integration import Integration

async def nuke(identifiers=None):
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        print("💥 Nuking Analytics Snapshots...")
        await session.exec(delete(ShopifyAnalyticsSnapshot))

        print("💥 Nuking Report Data...")
        await session.exec(delete(ShopifyReportData))

        print("💥 Nuking Reports...")
        await session.exec(delete(ShopifyReport))

        print("💥 Nuking Balance Transactions...")
        await session.exec(delete(ShopifyBalanceTransaction))

        print("💥 Nuking Payouts...")
        await session.exec(delete(ShopifyPayout))

        print("💥 Nuking Disputes...")
        await session.exec(delete(ShopifyDispute))

        print("💥 Nuking Daily Metrics...")
        await session.exec(delete(ShopifyDailyMetric))

        print("💥 Nuking Transactions...")
        await session.exec(delete(ShopifyTransaction))

        print("💥 Nuking Refunds...")
        await session.exec(delete(ShopifyRefund))

        print("💥 Nuking Line Items...")
        await session.exec(delete(ShopifyLineItem))
        
        print("💥 Nuking Orders...")
        await session.exec(delete(ShopifyOrder))
        
        print("💥 Nuking Addresses...")
        await session.exec(delete(ShopifyAddress))

        print("💥 Nuking Customers...")
        await session.exec(delete(ShopifyCustomer))

        print("💥 Nuking Inventory Levels...")
        await session.exec(delete(ShopifyInventoryLevel))

        print("💥 Nuking Product Images...")
        await session.exec(delete(ShopifyProductImage))

        print("💥 Nuking Product Variants...")
        await session.exec(delete(ShopifyProductVariant))

        print("💥 Nuking Products...")
        await session.exec(delete(ShopifyProduct))

        print("💥 Nuking Locations...")
        await session.exec(delete(ShopifyLocation))

        print("💥 Nuking Inventory Items...")
        await session.exec(delete(ShopifyInventoryItem))
        
        print("💥 Nuking Raw Ingest Audit Trail...")
        await session.exec(delete(ShopifyRawIngest))

        print(" sweep Clean: Resetting Sync Stats in Integrations...")
        stmt = select(Integration)
        res = await (session.execute(stmt))
        integrations = res.scalars().all()
        for integ in integrations:
            if integ.metadata_info and "sync_stats" in integ.metadata_info:
                stats = integ.metadata_info["sync_stats"]
                stats["orders_count"] = 0
                stats["products_count"] = 0
                stats["customers_count"] = 0
                stats["discounts_count"] = 0
                stats["total_revenue"] = 0.0
                integ.metadata_info["sync_stats"] = stats
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(integ, "metadata_info")
                session.add(integ)
        
        await session.commit()
        print("✅ Data Wiped Successfully.")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv("backend/.env")
    asyncio.run(nuke())
