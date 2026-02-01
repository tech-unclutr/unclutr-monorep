import asyncio
from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy.orm import sessionmaker
from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.models.integration import Integration, IntegrationStatus
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant
from app.models.shopify.inventory import ShopifyLocation, ShopifyInventoryLevel, ShopifyInventoryItem

async_session_factory = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def seed_module_3_data():
    async with async_session_factory() as session:
        # Get Integration
        stmt = select(Integration).where(Integration.status == IntegrationStatus.ACTIVE)
        integration = (await session.execute(stmt)).scalars().first()
        if not integration:
            print("❌ No active integration found. Cannot seed.")
            return

        print(f"🌱 Seeding data for Shop: {integration.metadata_info.get('shop')}")

        # 1. Create Location
        loc_id = 9001
        location = ShopifyLocation(
            integration_id=integration.id,
            company_id=integration.company_id,
            shopify_location_id=loc_id,
            name="Seed Warehouse",
            active=True,
            is_primary=True,
            shopify_created_at=datetime.utcnow(),
            shopify_updated_at=datetime.utcnow()
        )
        session.add(location)

        # 2. Create Product
        prod_id = 8001
        product = ShopifyProduct(
            integration_id=integration.id,
            company_id=integration.company_id,
            shopify_product_id=prod_id,
            title="Seeded Audit Product",
            vendor="Audit Corp",
            product_type="Test Item",
            status="active",
            handle="seeded-audit-product",
            created_by="SeedScript",
            updated_by="SeedScript",
            shopify_created_at=datetime.utcnow(),
            shopify_updated_at=datetime.utcnow()
        )
        session.add(product)
        await session.flush() # Need ID

        # 3. Create Variant
        var_id = 7001
        inv_item_id = 6001
        variant = ShopifyProductVariant(
            integration_id=integration.id,
            company_id=integration.company_id,
            product_id=product.id,
            shopify_variant_id=var_id,
            shopify_inventory_item_id=inv_item_id,
            title="Default Variant",
            sku="AUDIT-001",
            price=19.99,
            weight=1.5,
            created_by="SeedScript",
            updated_by="SeedScript",
            shopify_created_at=datetime.utcnow(),
            shopify_updated_at=datetime.utcnow()
        )
        session.add(variant)

        # 4. Create Inventory Item & Level
        inv_item = ShopifyInventoryItem(
            integration_id=integration.id,
            company_id=integration.company_id,
            shopify_inventory_item_id=inv_item_id,
            sku="AUDIT-001",
            cost=10.00,
            created_by="SeedScript",
            updated_by="SeedScript"
        )
        session.add(inv_item)

        level = ShopifyInventoryLevel(
            integration_id=integration.id,
            company_id=integration.company_id,
            shopify_inventory_item_id=inv_item_id,
            shopify_location_id=loc_id,
            available=50,
            shopify_updated_at=datetime.utcnow(),
            created_by="SeedScript",
            updated_by="SeedScript"
        )
        session.add(level)

        await session.commit()
        print("✅ Seeded 1 Product, 1 Variant, 1 Location, 1 Inventory Level.")

if __name__ == "__main__":
    asyncio.run(seed_module_3_data())
