import asyncio
import uuid
from datetime import datetime
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

        # 2. Prepare Payload (Dirty Data - Ghost Item)
        shopify_id = 8888888888  # Dummy ID
        payload = {
            "id": shopify_id,
            "title": "Dirty Data Ghost Item",
            "vendor": None,           # Missing Vendor
            "product_type": None,     # Missing Product Type
            "handle": "dirty-data-ghost-item",
            "status": "archived",      # Archived state
            "tags": "dirty,test",
            "variants": [
                {
                    "id": 9999999991,
                    "product_id": shopify_id,
                    "title": "Default Title",
                    "sku": None,       # Missing SKU
                    "barcode": None,   # Missing Barcode
                    "price": "0.00",
                    "inventory_item_id": 7777777771,
                    "inventory_quantity": 0
                }
            ]
        }
        
        payload_str = json.dumps(payload, sort_keys=True)
        dedupe_hash = hashlib.sha256(payload_str.encode()).hexdigest()

        # 3. Insert Raw Ingest
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
            "shopify_object_id": shopify_id,
            "shopify_updated_at": now_naive,
            "dedupe_key": f"dirty_product_{shopify_id}",
            "dedupe_hash_canonical": dedupe_hash,
            "source": "webhook",
            "topic": "products/create",
            "api_version": "2024-01",
            "headers": json.dumps({}),
            "payload": json.dumps(payload),
            "hmac_valid": True,
            "processing_status": "pending",
            "fetched_at": now_naive,
            "created_by": "Simulated Test",
            "diff_summary": json.dumps({})
        }
        
        await session.execute(insert_stmt, params)
        await session.commit()
        print(f"Inserted raw ingest: {raw_ingest_id}")

        # 4. Trigger Refinement
        print("Triggering refinement...")
        await shopify_refinement_service.process_pending_records(
            session=session,
            integration_id=integration_id,
            limit=10
        )
        await session.commit()
        print("Refinement completed.")

        # 5. Verify Database
        from app.models.shopify.product import ShopifyProduct
        
        verify_stmt = select(ShopifyProduct).where(ShopifyProduct.shopify_product_id == shopify_id)
        verify_res = await session.execute(verify_stmt)
        product = verify_res.scalars().first()

        if product:
            print(f"Verification: Vendor = {product.vendor}, Type = {product.product_type}, Status = {product.status}")
            if product.vendor == "Unknown Vendor" and product.product_type == "Generic" and product.status == "archived":
                print("TEST CASE 3 PASSED in Database (Fallback logic verified).")
            else:
                print(f"TEST CASE 3 FAILED: Unexpected values.")
        else:
            print("Verification: Product not found.")

if __name__ == "__main__":
    asyncio.run(simulate_webhook())
