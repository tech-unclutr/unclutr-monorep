
import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.orm import sessionmaker
from sqlmodel import select, delete
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import engine
from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.api.v1.endpoints.shopify_data import get_activity_log

# Target Integration
INTEGRATION_ID = UUID("30b8ed0a-7204-4c29-9a8d-80073fbcf04b") 

async def verify_stacking():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Fetch integration to get valid company_id
        from app.models.integration import Integration
        res = await session.execute(select(Integration).where(Integration.id == INTEGRATION_ID))
        integration = res.scalars().first()
        if not integration:
            print(f"Integration {INTEGRATION_ID} not found!")
            return
        
        COMPANY_ID = integration.company_id

        print(f"--- 1. Cleaning up previous logs for {INTEGRATION_ID} ---")
        stmt = delete(ShopifyRawIngest).where(ShopifyRawIngest.integration_id == INTEGRATION_ID)
        await session.execute(stmt)
        await session.commit()

        print("--- 2. Injecting 'The Flood' (50 Inventory Updates) ---")
        base_time = datetime.utcnow()
        
        logs = []
        # Batch 1: 25 updates
        for i in range(25):
            logs.append(ShopifyRawIngest(
                integration_id=INTEGRATION_ID,
                company_id=COMPANY_ID,
                shopify_object_id=1000 + i,
                object_type="inventory_level",
                topic="inventory_levels/update",
                processing_status="processed",
                payload={"inventory_item_id": 999, "available": 10 + i},
                fetched_at=base_time - timedelta(seconds=(50-i)),
                dedupe_key=f"mock_dedupe_1_{i}",
                dedupe_hash_canonical=f"mock_hash_1_{i}"
            ))
            
        # Interrupt: High Value Order
        logs.append(ShopifyRawIngest(
            integration_id=INTEGRATION_ID,
            company_id=COMPANY_ID,
            shopify_object_id=5000,
            object_type="order",
            topic="orders/create",
            processing_status="processed",
            payload={"id": 5000, "order_number": 1001, "total_price": "199.99"},
            fetched_at=base_time - timedelta(seconds=24),
            dedupe_key="mock_dedupe_order",
            dedupe_hash_canonical="mock_hash_order"
        ))
        
        # Batch 2: 25 updates
        for i in range(25):
            logs.append(ShopifyRawIngest(
                integration_id=INTEGRATION_ID,
                company_id=COMPANY_ID,
                shopify_object_id=2000 + i,
                object_type="inventory_level",
                topic="inventory_levels/update",
                processing_status="processed",
                payload={"inventory_item_id": 999, "available": 50 + i},
                fetched_at=base_time - timedelta(seconds=(23-i)),
                dedupe_key=f"mock_dedupe_2_{i}",
                dedupe_hash_canonical=f"mock_hash_2_{i}"
            ))

        session.add_all(logs)
        await session.commit()
        print("--- Injection Complete ---")
        
        # Verify
        print("--- 3. Verifying Output ---")
        results = await get_activity_log(
            integration_id=INTEGRATION_ID,
            session=session,
            limit=50
        )
        
        print(f"\n[RESULT] Fetched {len(results)} items (Limit 50)")
        
        for item in results:
            prefix = "[STACKED]" if item.get("is_stacked") else "[SINGLE]"
            count_str = f"(Count: {item.get('stacked_count')})" if item.get("is_stacked") else ""
            print(f"{prefix} {item['event']} {count_str} | {item['timestamp']} | Imp: {item['importance']}")
            
        # Assertions
        # Expectation: 
        # 1. Stack of 25 items (Batch 2 - most recent)
        # 2. Order Interrupt
        # 3. Stack of 25 items (Batch 1 - older)
        # Note: The 'time_gap > 300' logic in stacker won't splitting them, but the Interrupt WILL.
        # So we expect 3 distinct items.
        
        assert len(results) == 3, f"Expected 3 consolidated items, got {len(results)}"
        
        # Checking ordering (DESC)
        # Item 0: Batch 2 Stack
        assert results[0]["is_stacked"] == True
        assert results[0]["stacked_count"] == 25
        assert "Updated 25 inventory_levels" in results[0]["event"]
        
        # Item 1: Order
        assert results[1]["is_stacked"] == False, "Item 1 should be the High Value Order"
        assert "Whale Alert" in results[1]["event"] or "Order #1001" in results[1]["event"], "Item 1 should be Order #1001"
        
        # Item 2: Batch 1 Stack
        assert results[2]["is_stacked"] == True
        assert results[2]["stacked_count"] == 25
        
        print("\n✅ VERIFICATION SUCCESSFUL: Stacking logic works as expected.")

if __name__ == "__main__":
    asyncio.run(verify_stacking())
