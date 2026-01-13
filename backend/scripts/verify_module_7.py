import asyncio
import sys
import os
import uuid
from datetime import datetime
from sqlmodel import select, delete
from sqlalchemy.orm import selectinload

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import get_session
from app.models.integration import Integration
from app.models.shopify.order import ShopifyOrder
from app.services.shopify.reconciliation_service import shopify_reconciliation_service

async def verify_module_7():
    print("🛡️ Verifying Module 7: Zero-Drift Resilience...")
    
    async for session in get_session():
        # 1. Find an active Shopify integration
        stmt = select(Integration).where(Integration.status == "ACTIVE")
        result = await session.execute(stmt)
        integration = result.scalars().first()
        
        if not integration:
            print("❌ No active integration found.")
            return

        print(f"✅ Found Integration: {integration.id}")

        # --- TEST 1: The "Ghost" Test (Self-Healing Missing Data) ---
        print("\n👻 Step 1: Simulating 'Ghost' (Deleting a real order from DB)...")
        # Find a real order
        stmt = select(ShopifyOrder).where(ShopifyOrder.integration_id == integration.id).limit(1)
        result = await session.execute(stmt)
        real_order = result.scalars().first()
        
        if not real_order:
            print("❌ No orders found to test with.")
            return
            
        real_shopify_id = real_order.shopify_order_id
        print(f"   Deleting Order {real_shopify_id} (Local ID: {real_order.id})...")
        
        # Manually delete dependent transactions first to avoid FK violation in test
        # (In production, cascade might handle this, or we just don't delete orders raw often)
        from app.models.shopify.transaction import ShopifyTransaction
        stmt_trans = select(ShopifyTransaction).where(ShopifyTransaction.order_id == real_order.id)
        transactions = (await session.execute(stmt_trans)).scalars().all()
        for t in transactions:
            await session.delete(t)
            
        await session.delete(real_order)
        await session.commit()
        
        # Verify it's gone
        stmt = select(ShopifyOrder).where(ShopifyOrder.shopify_order_id == real_shopify_id)
        if not (await session.execute(stmt)).scalars().first():
            print("   ✅ Order deleted locally.")
        else:
            print("   ❌ Failed to delete order.")

        print("   💊 Triggering Reconciliation...")
        await shopify_reconciliation_service.reconcile_integration(session, integration)
        
        # Check if it's back
        stmt = select(ShopifyOrder).where(ShopifyOrder.shopify_order_id == real_shopify_id)
        resurrected_order = (await session.execute(stmt)).scalars().first()
        if resurrected_order:
            print(f"   ✅ SUCCESS: Ghost Order {real_shopify_id} healed!")
        else:
            print("   ❌ FAIL: Ghost Order was not healed.")

        # --- TEST 2: The "Zombie" Test (Deleting Data that shouldn't exist) ---
        print("\n🧟 Step 2: Simulating 'Zombie' (Creating a fake order in DB)...")
        fake_id = 99999999999
        zombie_order = ShopifyOrder(
            integration_id=integration.id,
            company_id=integration.company_id,
            shopify_order_id=fake_id,
            shopify_order_number=99999,
            shopify_name="#ZOMBIE",
            financial_status="paid",
            shopify_created_at=datetime.utcnow(),
            shopify_updated_at=datetime.utcnow()
        )
        session.add(zombie_order)
        await session.commit()
        print(f"   Created Zombie Order {fake_id}.")
        
        print("   💊 Triggering Reconciliation...")
        await shopify_reconciliation_service.reconcile_integration(session, integration)
        
        # Check if it's gone
        stmt = select(ShopifyOrder).where(ShopifyOrder.shopify_order_id == fake_id)
        surviving_zombie = (await session.execute(stmt)).scalars().first()
        if not surviving_zombie:
            print("   ✅ SUCCESS: Zombie Order exterminated!")
        else:
            print("   ❌ FAIL: Zombie Order is still alive.")

        print("\n🎉 Module 7 Verification Complete!")
        break

if __name__ == "__main__":
    asyncio.run(verify_module_7())
