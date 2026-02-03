
import asyncio
import sys
import os
import argparse
from sqlalchemy import text
from sqlmodel import SQLModel

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import get_session, engine

# Import Models to register them with SQLModel.metadata
# Note: We import them to ensure they are available in metadata
from app.models.integration import Integration
from app.models.integration_analytics import IntegrationDailyMetric
from app.models.metrics import IntegrationMetrics

# Import all Shopify models
from app.models.shopify.address import ShopifyAddress
from app.models.shopify.analytics import ShopifyAnalyticsSnapshot, ShopifyReport, ShopifyReportData
from app.models.shopify.checkout import ShopifyCheckout
from app.models.shopify.customer import ShopifyCustomer
from app.models.shopify.discount import ShopifyDiscountCode, ShopifyPriceRule
from app.models.shopify.financials import ShopifyBalanceTransaction, ShopifyPayout, ShopifyDispute
from app.models.shopify.fulfillment import ShopifyFulfillment
from app.models.shopify.inventory import ShopifyInventoryLevel, ShopifyInventoryItem, ShopifyLocation
from app.models.shopify.marketing import ShopifyMarketingEvent
from app.models.shopify.metrics import ShopifyDailyMetric
from app.models.shopify.order import ShopifyOrder, ShopifyLineItem
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant, ShopifyProductImage
from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.models.shopify.refund import ShopifyRefund
from app.models.shopify.transaction import ShopifyTransaction


# Define the specific tables we want to manage
# We use the __tablename__ attribute from the models
TARGET_MODELS = [
    # Child tables first (for drop order safety, though CASCADE handles it)
    ShopifyAddress,
    ShopifyAnalyticsSnapshot, ShopifyReportData, ShopifyReport,
    ShopifyCheckout,
    ShopifyCustomer,
    ShopifyDiscountCode, ShopifyPriceRule,
    ShopifyBalanceTransaction, ShopifyPayout, ShopifyDispute,
    ShopifyFulfillment,
    ShopifyInventoryLevel, ShopifyInventoryItem, ShopifyLocation,
    ShopifyMarketingEvent,
    ShopifyDailyMetric,
    ShopifyLineItem, ShopifyOrder,
    ShopifyProductImage, ShopifyProductVariant, ShopifyProduct,
    ShopifyRawIngest,
    ShopifyRefund,
    ShopifyTransaction,
    
    # Integration metrics
    IntegrationDailyMetric,
    IntegrationMetrics,
    
    # Parent table last
    Integration
]

async def archive_tables():
    """Drops the target tables from the database."""
    print("Archiving (Dropping) tables...")
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    # Drop in order: Dependents first would be nice, but CASCADE handles it.
    # We'll just iterate and drop.
    
    for model in TARGET_MODELS:
        table_name = model.__tablename__
        print(f"Dropping table: {table_name}")
        try:
            await session.exec(text(f"DROP TABLE IF EXISTS {table_name} CASCADE"))
        except Exception as e:
            print(f"Error dropping {table_name}: {e}")
            
    await session.commit()
    print("Archive complete. Tables dropped.")
    await session.close()

async def restore_tables():
    """Recreates the target tables using SQLModel."""
    print("Restoring (Creating) tables...")
    
    # SQLModel.metadata.create_all(engine) would create EVERYTHING.
    # We only want to create specific tables.
    
    # We can filter the metadata tables
    tables_to_create = []
    for model in TARGET_MODELS:
        table_name = model.__tablename__
        if table_name in SQLModel.metadata.tables:
            tables_to_create.append(SQLModel.metadata.tables[table_name])
        else:
            print(f"Warning: Table {table_name} not found in metadata!")
            
    if not tables_to_create:
        print("No tables found to create.")
        return

    print(f"Propagating schema for {len(tables_to_create)} tables...")
    
    # We use the sync engine for create_all usually, or run_sync
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all, tables=tables_to_create)
        
    print("Restore complete. Tables created.")

async def main():
    parser = argparse.ArgumentParser(description="Manage Integration and Shopify tables.")
    parser.add_argument("action", choices=["archive", "restore"], help="Action to perform")
    
    args = parser.parse_args()
    
    if args.action == "archive":
        await archive_tables()
    elif args.action == "restore":
        await restore_tables()

if __name__ == "__main__":
    asyncio.run(main())
