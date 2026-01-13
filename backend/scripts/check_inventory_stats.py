#!/usr/bin/env python3
"""
Quick check script to verify current inventory stats before/after webhook test.
"""
import asyncio
import uuid
import json
from sqlmodel import select, func
from app.core.db import engine
from app.models.integration import Integration
from app.models.shopify.inventory import ShopifyInventoryLevel
from sqlmodel.ext.asyncio.session import AsyncSession

async def check_inventory_stats(integration_id_str: str):
    integration_id = uuid.UUID(integration_id_str)
    
    async with AsyncSession(engine) as session:
        # Get integration metadata
        stmt = select(Integration).where(Integration.id == integration_id)
        res = await session.execute(stmt)
        integration = res.scalars().first()
        
        if not integration:
            print(f"❌ Integration {integration_id} not found")
            return
        
        # Get metadata stats
        sync_stats = integration.metadata_info.get("sync_stats", {})
        metadata_inventory = sync_stats.get("inventory_count", 0)
        
        # Get actual DB count
        inventory_stmt = select(func.sum(ShopifyInventoryLevel.available)).where(
            ShopifyInventoryLevel.integration_id == integration_id
        )
        db_inventory = (await session.execute(inventory_stmt)).scalar_one() or 0
        
        # Get count of inventory records
        count_stmt = select(func.count(ShopifyInventoryLevel.id)).where(
            ShopifyInventoryLevel.integration_id == integration_id
        )
        record_count = (await session.execute(count_stmt)).scalar_one() or 0
        
        print(f"\n📊 Inventory Stats for Integration {integration_id}")
        print(f"{'='*60}")
        print(f"📦 Metadata (cached):     {metadata_inventory} units")
        print(f"💾 Database (actual):     {db_inventory} units")
        print(f"📝 Total records:         {record_count} inventory levels")
        print(f"{'='*60}")
        
        if metadata_inventory == db_inventory:
            print(f"✅ Stats are in sync!")
        else:
            print(f"⚠️  Stats mismatch! Difference: {abs(metadata_inventory - db_inventory)} units")
        
        print(f"\n🔍 Full sync_stats:")
        print(json.dumps(sync_stats, indent=2))

if __name__ == "__main__":
    # Use your integration ID
    INTEGRATION_ID = "e261c1be-646b-4f5d-8d39-78a0454cb726"
    asyncio.run(check_inventory_stats(INTEGRATION_ID))
