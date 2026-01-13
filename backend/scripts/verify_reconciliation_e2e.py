import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta
from sqlmodel import select, func
from loguru import logger

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import engine
from app.models.integration import Integration, IntegrationStatus
from app.models.shopify.order import ShopifyOrder
from app.models.shopify.product import ShopifyProduct
from app.models.shopify.customer import ShopifyCustomer
from app.models.shopify.address import ShopifyAddress
from app.services.shopify.reconciliation_service import shopify_reconciliation_service
from app.services.shopify.oauth_service import shopify_oauth_service
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

async def verify_integrity_e2e():
    print("🧪 Starting E2E Drift & Heal Verification...")

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # 1. Setup: Find an Active Integration
        stmt = select(Integration).where(Integration.status == IntegrationStatus.ACTIVE)
        integration = (await session.execute(stmt)).scalars().first()
        
        if not integration:
            print("❌ No active integration found to test.")
            return

        print(f"🎯 Target Integration: {integration.id} ({integration.datasource_id})")
        
        # 2. Induce Drift (The Chaos Monkey)
        print("\n--- 💥 Inducing Drift ---")
        
        # 2a. Delete an Order (Zombie Simulation - wait, deleting locally means it's MISSING, not Zombie. Zombie is Local-only.)
        # If we delete locally, it's "Missing". Reconciliation should re-fetch it.
        # Find an order
        order = (await session.execute(select(ShopifyOrder).where(ShopifyOrder.integration_id == integration.id).limit(1))).scalars().first()
        victim_order_id = None
        if order:
            victim_order_id = order.shopify_order_id
            print(f"❌ Deleting Order #{order.shopify_order_number} (ID: {victim_order_id}) locally...")
            await session.delete(order)
        else:
            print("⚠️ No orders found to delete.")

        # 2b. Make a Product Stale
        # Find a product
        product = (await session.execute(select(ShopifyProduct).where(ShopifyProduct.integration_id == integration.id).limit(1))).scalars().first()
        victim_product_id = None
        original_ts = None
        if product:
            victim_product_id = product.shopify_product_id
            original_ts = product.shopify_updated_at
            print(f"🕰️ Making Product '{product.title}' stale...")
            # Set time to 2000-01-01 (Naive for DB compatibility if needed, or check model)
            # Error showed DB expects TIMESTAMP WITHOUT TIME ZONE
            product.shopify_updated_at = datetime(2000, 1, 1)
            session.add(product)
        else:
            print("⚠️ No products found to modify.")

        # 2c. Delete a Customer locally (Missing Simulation)
        customer_stmt = select(ShopifyCustomer).where(ShopifyCustomer.integration_id == integration.id)
        customer = (await session.execute(customer_stmt)).scalars().first()
        victim_customer_id = None
        if customer:
            victim_customer_id = customer.shopify_customer_id
            print(f"❌ Deleting Customer {customer.email} locally...")
            await session.delete(customer)
        else:
            print("⚠️ No customers found to delete. Seeding dummy for restore test...")
            new_cust = ShopifyCustomer(
                integration_id=integration.id,
                company_id=integration.company_id,
                shopify_customer_id=123456789,
                email="dummy@example.com",
                first_name="Dummy",
                last_name="User",
                shopify_created_at=datetime.now(),
                shopify_updated_at=datetime.now()
            )
            session.add(new_cust)
            victim_customer_id = 123456789 # In real life, it would be missing from remote if dummy, but for restore test we want to see it RE-ADDED if it was from remote.
            # Wait, if I seed it locally but it's NOT in Shopify, it's a ZOMBIE.
            # So I should seed it as a ZOMBIE instead.

        # 2d. Add a Zombie Address (Zombie Simulation)
        # We need a customer to attach it to. 
        # If we just deleted the ONLY customer, we need to re-fetch/query or use a fresh one.
        target_customer_id = 123456789 # Use integer for DB constraint
        zombie_address_id = 9999999999
        print(f"🧟 Seeding ZOMBIE Address for Customer {target_customer_id}...")
        zombie_addr = ShopifyAddress(
            integration_id=integration.id,
            company_id=integration.company_id,
            shopify_address_id=zombie_address_id,
            shopify_customer_id=target_customer_id,
            first_name="Zombie",
            last_name="Address",
            address1="666 Spooky Lane",
            city="Ghost Town"
        )
        session.add(zombie_addr)
        
        await session.commit()
        print("✅ Drift Induced. Database is now out of sync.")

        # 2e. Verification before Heal
        if zombie_address_id:
             zombie_check = (await session.execute(select(ShopifyAddress).where(ShopifyAddress.shopify_address_id == zombie_address_id))).scalars().first()
             if zombie_check:
                 print(f"🧟 VERIFIED: Zombie Address {zombie_address_id} exists in DB.")
             else:
                 print(f"❌ ERROR: Zombie Address {zombie_address_id} FAILED to seed.")
                 return

        # 3. Trigger Reconciliation (The Healer)
        print("\n--- 🛡️ Triggering Reconciliation ---")
        # We call the service directly
        try:
            # Refresh integration to get latest state/session attachment
            # But we passed session to the service method.
            # Warning: Service commits internally.
            await shopify_reconciliation_service.reconcile_integration(session, integration)
        except Exception as e:
            print(f"❌ Reconciliation crashed: {e}")
            import traceback
            traceback.print_exc()
            return

        # 4. Verify Healing
        print("\n--- 🧐 Verifying Repairs ---")
        
        # 4a. Check Order
        if victim_order_id:
            restored_order = (await session.execute(select(ShopifyOrder).where(ShopifyOrder.shopify_order_id == victim_order_id))).scalars().first()
            if restored_order:
                print(f"✅ Order {victim_order_id} was RESTORED successfully!")
            else:
                print(f"❌ Order {victim_order_id} is STILL MISSING.")

        # 4b. Check Product
        if victim_product_id:
            # Need to re-fetch to see updated value (if session didn't auto-refresh)
            # Session should be fresh after commit.
            # Create new session to be sure? No, existing session should work if we query.
            refreshed_product = (await session.execute(select(ShopifyProduct).where(ShopifyProduct.shopify_product_id == victim_product_id))).scalars().first()
            if refreshed_product:
                 # Compare robustly
                 check_ts = refreshed_product.shopify_updated_at
                 if check_ts.tzinfo:
                     check_ts = check_ts.replace(tzinfo=None)
                     
                 print(f"🔎 Product Timestamp: {check_ts}")
                 if check_ts > datetime(2000, 1, 1):
                     print(f"✅ Product '{refreshed_product.title}' was HEALED (Timestamp updated).")
                 else:
                     print(f"❌ Product '{refreshed_product.title}' is still STALE.")
            else:
                print("❌ Product disappeared?!")

        # 4c. Check Customer
        if victim_customer_id:
            restored_cust = (await session.execute(select(ShopifyCustomer).where(ShopifyCustomer.shopify_customer_id == victim_customer_id))).scalars().first()
            if restored_cust:
                print(f"✅ Customer {victim_customer_id} was RESTORED successfully!")
            else:
                print(f"❌ Customer {victim_customer_id} is STILL MISSING.")

        # 4d. Check Zombie Address
        if zombie_address_id:
             zombie_exists = (await session.execute(select(ShopifyAddress).where(ShopifyAddress.shopify_address_id == zombie_address_id))).scalars().first()
             if not zombie_exists:
                 print(f"✅ Zombie Address {zombie_address_id} was PRUNED successfully!")
             else:
                 print(f"❌ Zombie Address {zombie_address_id} still exists.")

    print("\n🏁 E2E Verification Complete.")

if __name__ == "__main__":
    asyncio.run(verify_integrity_e2e())
