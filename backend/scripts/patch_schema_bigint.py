
import asyncio
import sys
from sqlalchemy import text
from app.core.db import engine

async def run_patch():
    print("Patching schema to BIGINT...")
    async with engine.begin() as conn:
        print(" > ShopifyRawIngest...")
        await conn.execute(text("ALTER TABLE shopify_raw_ingest ALTER COLUMN shopify_object_id TYPE BIGINT"))
        
        print(" > ShopifyOrder...")
        await conn.execute(text("ALTER TABLE shopify_order ALTER COLUMN shopify_order_id TYPE BIGINT"))
        
        print(" > ShopifyLineItem...")
        await conn.execute(text("ALTER TABLE shopify_line_item ALTER COLUMN shopify_line_item_id TYPE BIGINT"))
        await conn.execute(text("ALTER TABLE shopify_line_item ALTER COLUMN product_id TYPE BIGINT"))
        await conn.execute(text("ALTER TABLE shopify_line_item ALTER COLUMN variant_id TYPE BIGINT"))
        
        print(" > ShopifyCustomer...")
        await conn.execute(text("ALTER TABLE shopify_customer ALTER COLUMN shopify_customer_id TYPE BIGINT"))
        
    print("Patch complete.")

if __name__ == "__main__":
    asyncio.run(run_patch())
