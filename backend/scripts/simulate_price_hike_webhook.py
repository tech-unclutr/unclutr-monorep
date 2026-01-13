import asyncio
import uuid
from datetime import datetime, timezone
import hashlib
import json
from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

# Models
from app.models.integration import Integration, IntegrationStatus
from app.services.shopify.refinement_service import shopify_refinement_service

DATABASE_URL = "postgresql+asyncpg://param@localhost:5432/postgres"
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def simulate_webhook():
    async with AsyncSessionLocal() as session:
        # 1. Get Integration
        stmt = select(Integration).where(Integration.status == IntegrationStatus.ACTIVE).limit(1)
        result = await session.execute(stmt)
        integration = result.scalars().first()
        
        if not integration:
            print("No active integration found.")
            return

        integration_id = integration.id
        company_id = integration.company_id
        print(f"Using Integration: {integration_id}, Company: {company_id}")

        # 2. Prepare Payload (Product Update)
        # Target: The 3p Fulfilled Snowboard
        # Available: 10 (to avoid Out of Stock message)
        
        payload = {
            "id": 9136083632352,
            "title": "The 3p Fulfilled Snowboard",
            "vendor": "Shopify",
            "product_type": "Snowboard",
            "handle": "the-3p-fulfilled-snowboard",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "status": "active",
            "tags": "verified-by-unclutr",
            "variants": [
                {
                    "id": 48529867604192,
                    "product_id": 9136083632352,
                    "title": "Default Title",
                    "price": "99.99",
                    "sku": "sku-hosted-1",
                    "inventory_quantity": 10,  # Non-zero
                    "inventory_item_id": 50629646647520,
                    "admin_graphql_api_id": "gid://shopify/ProductVariant/48529867604192"
                }
            ],
            "admin_graphql_api_id": "gid://shopify/Product/9136083632352"
        }
        
        payload_str = json.dumps(payload, sort_keys=True)
        dedupe_hash = hashlib.sha256(payload_str.encode()).hexdigest()

        # 3. Construct Diff Summary
        diff_summary = {
            "price_change": {
                "variant_title": "Default Title",
                "old": "19.99",
                "new": "99.99"
            }
        }

        # 4. Insert Raw Ingest
        raw_ingest_id = uuid.uuid4()
        insert_stmt = text("""
            INSERT INTO shopify_raw_ingest (
                id, integration_id, company_id, object_type, shopify_object_id, 
                shopify_updated_at, dedupe_key, dedupe_hash_canonical, source, 
                topic, api_version, headers, payload, hmac_valid, 
                processing_status, fetched_at, created_by, diff_summary
            ) VALUES (
                :id, :integration_id, :company_id, :object_type, :shopify_object_id, 
                :shopify_updated_at, :dedupe_key, :dedupe_hash_canonical, :source, 
                :topic, :api_version, :headers, :payload, :hmac_valid, 
                :processing_status, :fetched_at, :created_by, :diff_summary
            )
        """)
        
        now_naive = datetime.now()
        
        params = {
            "id": raw_ingest_id,
            "integration_id": integration_id,
            "company_id": company_id,
            "object_type": "product",
            "shopify_object_id": 9136083632352,
            "shopify_updated_at": now_naive,
            "dedupe_key": f"product_{9136083632352}_{int(datetime.now().timestamp())}",
            "dedupe_hash_canonical": dedupe_hash,
            "source": "webhook",
            "topic": "products/update",
            "api_version": "2024-01",
            "headers": json.dumps({}),
            "payload": json.dumps(payload),
            "hmac_valid": True,
            "processing_status": "pending",
            "fetched_at": now_naive,
            "created_by": "Simulated Test",
            "diff_summary": json.dumps(diff_summary)
        }
        
        await session.execute(insert_stmt, params)
        await session.commit()
        print(f"Inserted raw ingest: {raw_ingest_id}")

        # 5. Trigger Refinement
        print("Triggering refinement...")
        await shopify_refinement_service.process_pending_records(
            session=session,
            integration_id=integration_id,
            limit=10
        )
        await session.commit()
        print("Refinement completed.")

        # 6. Verify Database
        from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant
        
        verify_prod_stmt = select(ShopifyProduct).where(ShopifyProduct.shopify_product_id == 9136083632352)
        verify_prod_result = await session.execute(verify_prod_stmt)
        product = verify_prod_result.scalars().first()
        
        verify_variant_stmt = select(ShopifyProductVariant).where(ShopifyProductVariant.shopify_variant_id == 48529867604192)
        verify_variant_result = await session.execute(verify_variant_stmt)
        variant = verify_variant_result.scalars().first()

        if product and variant:
            print(f"Verification: Price = {variant.price}, Tags = {product.tags}")
            if float(variant.price) == 99.99 and "verified-by-unclutr" in product.tags:
                print("TEST CASE 2 PASSED in Database.")
            else:
                print(f"TEST CASE 2 FAILED: Price={variant.price}, Tags={product.tags}")
        else:
            print("Verification: Product or Variant not found.")

if __name__ == "__main__":
    asyncio.run(simulate_webhook())
