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

        # 2. Prepare Payload (Inventory Level Update)
        payload = {
            "inventory_item_id": 50629646647520,
            "location_id": 87525294304,
            "available": 0,
            "updated_at": datetime.now().isoformat()
        }
        
        payload_str = json.dumps(payload, sort_keys=True)
        dedupe_hash = hashlib.sha256(payload_str.encode()).hexdigest()

        # 3. Insert Raw Ingest via Raw SQL using strings for JSONB if needed, or keeping it as is
        raw_ingest_id = uuid.uuid4()
        
        # Explicitly cast JSONB columns if needed, but asyncpg usually handles dicts
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
            "object_type": "inventory_level",
            "shopify_object_id": 50629646647520,
            "shopify_updated_at": now_naive,
            "dedupe_key": f"inventory_level_{50629646647520}_{87525294304}_{int(datetime.now().timestamp())}",
            "dedupe_hash_canonical": dedupe_hash,
            "source": "webhook",
            "topic": "inventory_levels/update",
            "api_version": "2024-01",
            "headers": json.dumps({}),
            "payload": json.dumps(payload),
            "hmac_valid": True,
            "processing_status": "pending",
            "fetched_at": now_naive,
            "created_by": "Simulated Test",
            "diff_summary": json.dumps({})
        }
        
        try:
            await session.execute(insert_stmt, params)
            await session.commit()
            print(f"Inserted raw ingest: {raw_ingest_id}")
        except Exception as e:
            print(f"Insertion Error: {e}")
            await session.rollback()
            return

        # 4. Trigger Refinement
        print("Triggering refinement...")
        try:
            await shopify_refinement_service.process_pending_records(
                session=session,
                integration_id=integration_id,
                limit=10
            )
            await session.commit()
            print("Refinement completed.")
        except Exception as e:
            print(f"Refinement Error: {e}")
            await session.rollback()
            return

        # 5. Verify Database
        verify_stmt = text("""
            SELECT available FROM shopify_inventory_level 
            WHERE shopify_inventory_item_id = 50629646647520 
            AND shopify_location_id = 87525294304
        """)
        verify_result = await session.execute(verify_stmt)
        available = verify_result.scalar()
        
        if available is not None:
            print(f"Verification: Available = {available}")
            if available == 0:
                print("TEST CASE 1 PASSED in Database.")
            else:
                print(f"TEST CASE 1 FAILED in Database. Available is {available}")
        else:
            print("Verification: Level not found.")

if __name__ == "__main__":
    asyncio.run(simulate_webhook())
