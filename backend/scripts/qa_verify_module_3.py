import asyncio
import httpx
from uuid import UUID
from sqlmodel import select
from sqlalchemy.orm import sessionmaker
from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession

async_session_factory = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)
from app.models.integration import Integration
from app.models.shopify.inventory import ShopifyInventoryLevel
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant
from app.models.shopify.order import ShopifyOrder

async def verify_qa_scenarios():
    async with async_session_factory() as session:
        # 1. Find a valid Integration
        res = await session.execute(select(Integration).limit(1))
        integration = res.scalars().first()
        if not integration:
            print("❌ No integration found. Seed the DB first.")
            return

        shop_domain = integration.metadata_info.get("shop")
        integration_id = integration.id
        print(f"🔄 Using Integration: {integration_id} | Shop: {shop_domain}")

        # --- Scenario 1: The Inventory Ghost (Zero Stock) ---
        print("\n👻 Scenario 1: The Inventory Ghost (Zero Stock)")
        # Mocking an inventory level update to 0
        mock_inventory_payload = {
            "inventory_item_id": 999111,
            "location_id": 888222,
            "available": 0,
            "updated_at": "2026-01-11T12:00:00Z"
        }
        
        # We manually trigger the webhook endpoint (Internal call for simulation)
        from app.services.shopify.sync_service import shopify_sync_service
        from app.services.shopify.refinement_service import shopify_refinement_service
        
        await shopify_sync_service.ingest_raw_object(
            session=session,
            integration=integration,
            object_type="inventory_level",
            payload=mock_inventory_payload,
            source="webhook",
            topic="inventory_levels/update"
        )
        await session.commit()
        
        # Process refinement
        await shopify_refinement_service.process_pending_records(session)
        
        # Verify DB
        stmt = select(ShopifyInventoryLevel).where(
            ShopifyInventoryLevel.shopify_inventory_item_id == 999111,
            ShopifyInventoryLevel.shopify_location_id == 888222
        )
        result = await session.execute(stmt)
        level = result.scalars().first()
        if level and level.available == 0:
            print("✅ Verified: Inventory level correctly set to 0.")
        else:
            print(f"❌ Failed: Inventory level is {level.available if level else 'NOT FOUND'}")

        # --- Scenario 2: Dirty Data (Missing SKU / Product Fields) ---
        print("\n💩 Scenario 2: Dirty Data (Missing SKU / Metadata)")
        mock_product_payload = {
            "id": 777333,
            "title": "Dirty Product",
            "vendor": "", # Missing vendor
            "variants": [
                {
                    "id": 666444,
                    "title": "Default",
                    "price": "19.99",
                    "sku": None, # Missing SKU
                    "inventory_item_id": 555555
                }
            ]
        }
        
        await shopify_sync_service.ingest_raw_object(
            session=session,
            integration=integration,
            object_type="product",
            payload=mock_product_payload,
            source="manual_qa",
            topic="products/create"
        )
        await session.commit()
        await shopify_refinement_service.process_pending_records(session)
        
        # Verify Product
        p_stmt = select(ShopifyProduct).where(ShopifyProduct.shopify_product_id == 777333)
        p_res = await session.execute(p_stmt)
        product = p_res.scalars().first()
        
        v_stmt = select(ShopifyProductVariant).where(ShopifyProductVariant.shopify_variant_id == 666444)
        v_res = await session.execute(v_stmt)
        variant = v_res.scalars().first()
        
        if product and product.vendor == "Unknown Vendor":
            print("✅ Verified: Missing vendor defaulted gracefully.")
        else:
            print(f"❌ Failed: Product vendor is '{product.vendor if product else 'NOT FOUND'}'")
            
        if variant and variant.sku is None:
            print("✅ Verified: Missing SKU handled (null in DB).")
        else:
            print(f"❌ Failed: Variant SKU is '{variant.sku if variant else 'NOT FOUND'}'")

        # --- Scenario 3: Bulk Simulation (Pagination / Scale) ---
        print("\n📈 Phase 3: High-Scale Ingestion (Simulated)")
        # Ingesting multiple objects to ensure refinement batching works
        for i in range(10):
            await shopify_sync_service.ingest_raw_object(
                session=session,
                integration=integration,
                object_type="order",
                payload={"id": 1000 + i, "order_number": 1000 + i, "total_price": "100.00"},
                source="manual_qa"
            )
        await session.commit()
        refined_count = await shopify_refinement_service.process_pending_records(session, limit=100)
        print(f"✅ Processed {refined_count} records in batch refinement.")

if __name__ == "__main__":
    asyncio.run(verify_qa_scenarios())
