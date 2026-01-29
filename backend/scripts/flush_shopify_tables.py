"""
Flush all Shopify-related tables for clean testing.

This script will:
1. Delete all Shopify data (products, orders, customers, inventory, metrics)
2. Preserve integrations and workspace/brand structure
3. Allow for fresh data sync from Shopify

WARNING: This will delete ALL Shopify data. Use with caution!
"""
import asyncio
from app.core.db import get_session
from sqlalchemy import text
from loguru import logger

async def flush_shopify_tables():
    """
    Flush all Shopify-related tables while preserving integrations.
    """
    async for session in get_session():
        logger.info("Starting Shopify table flush...")
        
        # List of Shopify tables to flush (in dependency order)
        tables = [
            # Dependent tables first
            'shopify_line_item',
            'shopify_transaction',
            'shopify_fulfillment',
            'shopify_refund',
            
            # Order-related
            'shopify_order',
            
            # Product-related
            'shopify_product_image',
            'shopify_product_variant',
            'shopify_product',
            
            # Inventory
            'shopify_inventory_level',
            'shopify_inventory_item',
            
            # Customer
            'shopify_customer',
            
            # Metrics
            'shopify_daily_metric',
            
            # Collections
            'shopify_collection',
            
            # Other
            'shopify_discount_code',
            'shopify_price_rule',
            'shopify_marketing_event',
            'shopify_checkout',
            'shopify_payout',
            'shopify_dispute',
        ]
        
        total_deleted = 0
        
        for table in tables:
            try:
                # Check if table exists
                result = await session.execute(text(f"""
                    SELECT COUNT(*) 
                    FROM information_schema.tables 
                    WHERE table_name = '{table}'
                """))
                table_exists = result.scalar() > 0
                
                if not table_exists:
                    logger.debug(f"Table {table} does not exist, skipping")
                    continue
                
                # Get count before deletion
                result = await session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count_before = result.scalar()
                
                if count_before == 0:
                    logger.debug(f"Table {table} is already empty")
                    continue
                
                # Delete all rows
                await session.execute(text(f"DELETE FROM {table}"))
                
                logger.info(f"✅ Flushed {table}: {count_before:,} rows deleted")
                total_deleted += count_before
                
            except Exception as e:
                logger.error(f"❌ Error flushing {table}: {e}")
        
        # Commit the transaction
        await session.commit()
        
        logger.success(f"\n🎉 Flush complete! Total rows deleted: {total_deleted:,}")
        logger.info("\n📝 Next steps:")
        logger.info("   1. Trigger a fresh Shopify sync")
        logger.info("   2. Wait for data to populate")
        logger.info("   3. Verify insights are generated correctly")
        
        break

if __name__ == "__main__":
    print("="*80)
    print("⚠️  SHOPIFY TABLE FLUSH")
    print("="*80)
    print("\nThis will DELETE ALL Shopify data from the database.")
    print("Integrations and workspace structure will be preserved.")
    print("\nAre you sure you want to continue? (yes/no): ", end="")
    
    confirmation = input().strip().lower()
    
    if confirmation == "yes":
        print("\n🚀 Starting flush...\n")
        asyncio.run(flush_shopify_tables())
    else:
        print("\n❌ Flush cancelled.")
