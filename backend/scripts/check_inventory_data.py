"""
Script to check if inventory data exists in the database.
"""
import asyncio
from sqlalchemy import select, func
from app.core.db import get_session
from app.models.shopify.inventory import ShopifyInventoryLevel, ShopifyInventoryItem
from app.models.integration import Integration
from app.models.company import Workspace, Brand

async def check_inventory_data():
    """Check if inventory data exists for any brand."""
    async for session in get_session():
        try:
            # Check total inventory items
            items_stmt = select(func.count(ShopifyInventoryItem.id))
            items_count = (await session.execute(items_stmt)).scalar()
            
            # Check total inventory levels
            levels_stmt = select(func.count(ShopifyInventoryLevel.id))
            levels_count = (await session.execute(levels_stmt)).scalar()
            
            # Check inventory with cost data
            items_with_cost_stmt = select(func.count(ShopifyInventoryItem.id)).where(
                ShopifyInventoryItem.cost.isnot(None)
            )
            items_with_cost = (await session.execute(items_with_cost_stmt)).scalar()
            
            # Check inventory value calculation
            value_stmt = select(
                func.sum(ShopifyInventoryLevel.available * ShopifyInventoryItem.cost).label("total_value"),
                func.count(func.distinct(ShopifyInventoryItem.id)).label("total_items"),
                func.sum(ShopifyInventoryLevel.available).label("total_units")
            ).join(
                ShopifyInventoryItem,
                ShopifyInventoryLevel.shopify_inventory_item_id == ShopifyInventoryItem.shopify_inventory_item_id
            ).where(
                ShopifyInventoryLevel.available > 0,
                ShopifyInventoryItem.cost.isnot(None)
            )
            
            result = (await session.execute(value_stmt)).first()
            
            print("\n" + "="*60)
            print("INVENTORY DATA CHECK")
            print("="*60)
            print(f"\nTotal ShopifyInventoryItem records: {items_count}")
            print(f"Total ShopifyInventoryLevel records: {levels_count}")
            print(f"Items with cost data: {items_with_cost}")
            print(f"\nCalculated Inventory Metrics:")
            print(f"  - Total Value: ${result.total_value or 0:,.2f}")
            print(f"  - Unique Items: {result.total_items or 0}")
            print(f"  - Total Units: {result.total_units or 0}")
            
            if result.total_value and result.total_value > 0:
                print(f"\n✅ Inventory data EXISTS - Insight should be generated")
            else:
                print(f"\n❌ No inventory data found - Insight will NOT be generated")
                print(f"\nPossible reasons:")
                print(f"  1. Shopify inventory sync hasn't run yet")
                print(f"  2. No products have cost data in Shopify")
                print(f"  3. All inventory levels are zero")
            
            print("="*60 + "\n")
            
        except Exception as e:
            print(f"Error checking inventory data: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_inventory_data())
