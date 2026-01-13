import asyncio
from sqlalchemy import select, func, text
from sqlalchemy.orm import sessionmaker
from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.integration import Integration, IntegrationStatus
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant, ShopifyProductImage
from app.models.shopify.inventory import ShopifyInventoryLevel, ShopifyInventoryItem, ShopifyLocation

async_session_factory = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def deep_audit_module_3():
    print("\n🔍 Starting Deep Audit for Module 3 (Products & Inventory)...\n")
    
    async with async_session_factory() as session:
        # 1. Integration Status
        print("--- 1. Integration Health ---")
        stmt = select(Integration).where(Integration.status == IntegrationStatus.ACTIVE)
        integrations = (await session.execute(stmt)).scalars().all()
        if not integrations:
            print("❌ CRITICAL: No ACTIVE integration found!")
        else:
            for i in integrations:
                 print(f"✅ Integration Active: {i.metadata_info.get('shop')} (ID: {i.id})")

        # 2. Product Orphans (Variants without Products)
        print("\n--- 2. Orphan Check ---")
        orphan_query = text("""
            SELECT count(*) FROM shopify_product_variant v
            LEFT JOIN shopify_product p ON v.product_id = p.id
            WHERE p.id IS NULL
        """)
        orphans = (await session.execute(orphan_query)).scalar()
        if orphans > 0:
             print(f"❌ FAIL: Found {orphans} orphaned Variants!")
        else:
             print("✅ PASS: No orphaned variants.")

        # 3. Inventory Consistnecy
        print("\n--- 3. Inventory Consistency ---")
        neg_query = select(ShopifyInventoryLevel).where(ShopifyInventoryLevel.available < 0)
        neg_stock = (await session.execute(neg_query)).scalars().all()
        if neg_stock:
            print(f"⚠️ WARNING: Found {len(neg_stock)} inventory levels with negative stock.")
        else:
            print("✅ PASS: No negative inventory levels.")

        # 4. Data Completeness (Fields that should not be null)
        print("\n--- 4. Data Completeness ---")
        # Check for unnamed products
        unnamed_query = select(ShopifyProduct).where(
            (ShopifyProduct.title == None) | (ShopifyProduct.title == "") | (ShopifyProduct.title == "Unnamed Product")
        )
        unnamed = (await session.execute(unnamed_query)).scalars().all()
        if unnamed:
            print(f"⚠️ WARNING: Found {len(unnamed)} products with placeholder/empty titles.")
        else:
            print("✅ PASS: All products have valid titles.")

        # Check for zero price but active (might be okay, but worth noting)
        zero_price_query = select(ShopifyProductVariant).where(ShopifyProductVariant.price == 0)
        zero_price = (await session.execute(zero_price_query)).scalars().all()
        if zero_price:
             print(f"ℹ️ INFO: Found {len(zero_price)} free variants (Price = 0).")
        else:
             print("✅ PASS: No free variants.")

        # 5. Counts alignment
        print("\n--- 5. Statistical Alignment ---")
        p_count = (await session.execute(select(func.count(ShopifyProduct.id)))).scalar()
        v_count = (await session.execute(select(func.count(ShopifyProductVariant.id)))).scalar()
        l_count = (await session.execute(select(func.count(ShopifyLocation.id)))).scalar()
        inv_count = (await session.execute(select(func.sum(ShopifyInventoryLevel.available)))).scalar() or 0
        
        print(f"Stats:\n- Products: {p_count}\n- Variants: {v_count}\n- Locations: {l_count}\n- Total Stock: {inv_count}")
        
        if p_count > 0 and v_count == 0:
             print("❌ FAIL: Products exist but have 0 variants (impossible in Shopify data model).")
        elif p_count > 0:
             print("✅ PASS: Product / Variant hierarchy seems populated.")

    print("\n🏁 Audit Complete.")

if __name__ == "__main__":
    asyncio.run(deep_audit_module_3())
