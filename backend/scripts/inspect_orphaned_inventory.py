import asyncio
import sys
import os
from sqlmodel import select
from sqlalchemy.orm import selectinload

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import get_session
from app.models.shopify.inventory import ShopifyInventoryLevel, ShopifyLocation

async def inspect_and_fix_orphans():
    print("🔍 Inspecting Orphaned Inventory Levels...")
    
    async for session in get_session():
        # Find inventory levels where the location is missing for the same integration
        stmt = select(ShopifyInventoryLevel)
        levels = (await session.execute(stmt)).scalars().all()
        
        orphans = []
        for level in levels:
            # Check if location exists
            loc_stmt = select(ShopifyLocation).where(
                ShopifyLocation.shopify_location_id == level.shopify_location_id,
                ShopifyLocation.integration_id == level.integration_id
            )
            location = (await session.execute(loc_stmt)).scalars().first()
            
            if not location:
                orphans.append(level)
                print(f"❌ Found Orphan: InventoryLevel ID={level.id}, LocationID={level.shopify_location_id}, ItemID={level.shopify_inventory_item_id}")

        if not orphans:
            print("✅ No orphans found!")
            return

        print(f"⚠️ Found {len(orphans)} orphaned inventory levels. Deleting...")
        
        for orphan in orphans:
            await session.delete(orphan)
            print(f"🗑️ Deleted Orphan: {orphan.id}")
        
        await session.commit()
        print("✅ Cleanup Complete.")

if __name__ == "__main__":
    asyncio.run(inspect_and_fix_orphans())
