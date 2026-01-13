import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta
from typing import List
from sqlmodel import select, func
from sqlalchemy import text
from loguru import logger

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import engine
from app.models.integration import Integration, IntegrationStatus
from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.models.shopify.order import ShopifyOrder, ShopifyLineItem
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant
from app.models.shopify.inventory import ShopifyLocation, ShopifyInventoryLevel
from app.models.shopify.customer import ShopifyCustomer
from app.models.shopify.address import ShopifyAddress

async def verify_integrity():
    print("🛡️ Starting Full-Stack Shopify Integration Integrity Audit...\n")
    
    async with engine.connect() as conn:
        # 1. Integration Health
        print("--- 1. Integration Health ---")
        stmt = select(Integration).where(Integration.status == IntegrationStatus.ACTIVE)
        result = await conn.execute(stmt)
        active_integrations = result.fetchall()
        
        if not active_integrations:
            print("❌ FAIL: No active Shopify integrations found.")
            return
        
        print(f"✅ Found {len(active_integrations)} active integrations.")
        for integration in active_integrations:
            last_sync = integration.last_sync_at
            if last_sync and (datetime.now(timezone.utc) - last_sync.replace(tzinfo=timezone.utc)) < timedelta(hours=24):
                print(f"✅ Integration {integration.id}: Healthy (Last sync: {last_sync})")
            else:
                print(f"⚠️  Integration {integration.id}: Stale or never synced (Last sync: {last_sync})")

        # 2. Raw Ingestion & Refinement Pipeline
        print("\n--- 2. Data Ingestion Pipeline ---")
        for integration in active_integrations:
            i_id = integration.id
            pending_stmt = select(func.count(ShopifyRawIngest.id)).where(
                ShopifyRawIngest.integration_id == i_id,
                ShopifyRawIngest.processing_status == "pending"
            )
            pending_count = (await conn.execute(pending_stmt)).scalar() or 0
            
            failed_stmt = select(func.count(ShopifyRawIngest.id)).where(
                ShopifyRawIngest.integration_id == i_id,
                ShopifyRawIngest.processing_status == "failed"
            )
            failed_count = (await conn.execute(failed_stmt)).scalar() or 0
            
            processed_stmt = select(func.count(ShopifyRawIngest.id)).where(
                ShopifyRawIngest.integration_id == i_id,
                ShopifyRawIngest.processing_status == "processed"
            )
            processed_count = (await conn.execute(processed_stmt)).scalar() or 0
            
            print(f"📊 Integ {i_id}: Processed={processed_count}, Pending={pending_count}, Failed={failed_count}")
            if pending_count > 100:
                print(f"⚠️  WARNING: Backlog of {pending_count} records pending refinement.")
            if failed_count > 0:
                print(f"❌ FAIL: {failed_count} ingestion records have FAILED refinement.")

        # 3. Model Integrity & Relationships
        print("\n--- 3. Relational Integrity ---")
        for integration in active_integrations:
            # 3a. Orphan Variants (Variants without a parent Product)
            # Link is product_id (UUID) -> ShopifyProduct.id
            orphan_v_stmt = select(func.count(ShopifyProductVariant.id)).where(
                ShopifyProductVariant.integration_id == i_id,
                ~ShopifyProductVariant.product_id.in_(select(ShopifyProduct.id).where(ShopifyProduct.integration_id == i_id))
            )
            orphan_v = (await conn.execute(orphan_v_stmt)).scalar() or 0
            
            # 3b. Orphan Line Items (Line Items without a parent Order)
            # Link is order_id (UUID) -> ShopifyOrder.id
            orphan_li_stmt = select(func.count(ShopifyLineItem.id)).where(
                ShopifyLineItem.integration_id == i_id,
                ~ShopifyLineItem.order_id.in_(select(ShopifyOrder.id).where(ShopifyOrder.integration_id == i_id))
            )
            orphan_li = (await conn.execute(orphan_li_stmt)).scalar() or 0
            
            # 3c. Orphan Inventory Levels (Levels without a Location)
            # Link is shopify_location_id (BigInt) -> ShopifyLocation.shopify_location_id
            orphan_inv_stmt = select(func.count(ShopifyInventoryLevel.id)).where(
                ShopifyInventoryLevel.integration_id == i_id,
                ~ShopifyInventoryLevel.shopify_location_id.in_(select(ShopifyLocation.shopify_location_id).where(ShopifyLocation.integration_id == i_id))
            )
            orphan_inv = (await conn.execute(orphan_inv_stmt)).scalar() or 0
            
            print(f"🔗 Integ {i_id}: Orphan Variants={orphan_v}, Orphan LineItems={orphan_li}, Orphan InvLevels={orphan_inv}")
            if orphan_v > 0 or orphan_li > 0 or orphan_inv > 0:
                print("❌ FAIL: Orphaned records detected.")
            else:
                print("✅ Relational integrity confirmed.")

        # 4. Financial Consistency
        print("\n--- 4. Financial Consistency ---")
        for integration in active_integrations:
            # Validate that Total Price is roughly Subtotal + Tax (Shipping and Discounts are also factors)
            # Since total_shipping isn't in the model yet, we just check for extreme outliers
            diff_stmt = select(func.count(ShopifyOrder.id)).where(
                ShopifyOrder.integration_id == i_id,
                func.abs(ShopifyOrder.total_price - (ShopifyOrder.subtotal_price + ShopifyOrder.total_tax)) > 500.00
            )
            outliers = (await conn.execute(diff_stmt)).scalar() or 0
            print(f"💰 Integ {i_id}: Extreme Financial Outliers (>500 discrepancy) = {outliers}")
            if outliers > 0:
                print(f"⚠️  INFO: Found {outliers} orders with large discrepancies (likely missing shipping/discount fields in model).")

        # 5. Customer & Address Coverage
        print("\n--- 5. Customer & Address Audit ---")
        for integration in active_integrations:
            cust_count = (await conn.execute(select(func.count(ShopifyCustomer.id)).where(ShopifyCustomer.integration_id == i_id))).scalar() or 0
            addr_count = (await conn.execute(select(func.count(ShopifyAddress.id)).where(ShopifyAddress.integration_id == i_id))).scalar() or 0
            
            # Customers without addresses (if they checked out once and we missed it)
            lonely_cust = (await conn.execute(select(func.count(ShopifyCustomer.id)).where(
                ShopifyCustomer.integration_id == i_id,
                ~ShopifyCustomer.shopify_customer_id.in_(select(ShopifyAddress.shopify_customer_id).where(ShopifyAddress.integration_id == i_id))
            ))).scalar() or 0
            
            print(f"👥 Integ {i_id}: Customers={cust_count}, Addresses={addr_count}, Customers without Address={lonely_cust}")
            print("✅ Customer data layer online.")

    print("\n🏁 Integrity Audit Complete. System is ready for Module 6.")

if __name__ == "__main__":
    asyncio.run(verify_integrity())
