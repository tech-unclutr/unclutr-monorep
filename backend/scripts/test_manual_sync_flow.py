import asyncio
import uuid
import json
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from sqlmodel import select, delete
from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models.integration import Integration, IntegrationStatus
from app.models.datasource import DataSource
from app.models.company import Company
from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.models.shopify.order import ShopifyOrder

# Import the task to test
from app.services.shopify.tasks import run_shopify_sync_task

async def create_test_data(session):
    from app.models.company import Company, Brand, Workspace
    
    # 1. Company
    stmt = select(Company)
    company = (await session.execute(stmt)).scalars().first()
    if not company:
        company = Company(brand_name="Test Company", legal_name="Test Co Logs")
        session.add(company)
        await session.commit()
    
    # 1.5 Brand & Workspace
    stmt = select(Brand).where(Brand.company_id == company.id)
    brand = (await session.execute(stmt)).scalars().first()
    if not brand:
        brand = Brand(company_id=company.id, name="Test Brand")
        session.add(brand)
        await session.commit()
        
    stmt = select(Workspace).where(Workspace.brand_id == brand.id)
    workspace = (await session.execute(stmt)).scalars().first()
    if not workspace:
        workspace = Workspace(company_id=company.id, brand_id=brand.id, name="Test Workspace")
        session.add(workspace)
        await session.commit()
    
    # 2. DataSource
    stmt = select(DataSource).where(DataSource.slug == "shopify")
    ds = (await session.execute(stmt)).scalars().first()
    
    if not ds:
        ds = DataSource(
            name="Shopify Test",
            slug="shopify",
            category="Storefront",
            is_implemented=True
        )
        session.add(ds)
        await session.commit()
    
    # 3. Integration
    integration = Integration(
        company_id=company.id,
        workspace_id=workspace.id,
        datasource_id=ds.id,
        status=IntegrationStatus.ACTIVE,
        metadata_info={"shop": "test-store.myshopify.com", "sync_stats": {}}
    )
    session.add(integration)
    await session.commit()
    return integration

async def mock_fetch_and_ingest(session, integration_id):
    """
    Simulates fetching 120 records by inserting them as RAW pending.
    """
    print("--- [Mock] Fetching Data from Shopify... ---")
    await asyncio.sleep(1) # Simulate network
    
    integration = await session.get(Integration, integration_id)
    
    # Insert 120 raw records
    for i in range(120):
        raw = ShopifyRawIngest(
            integration_id=integration.id,
            company_id=integration.company_id,
            object_type="order",
            shopify_object_id=1000 + i,
            dedupe_key=f"order_{1000+i}",
            dedupe_hash_canonical=f"hash_{1000+i}",
            processing_status="pending",
            payload={
                "id": 1000 + i,
                "order_number": 1000 + i,
                "name": f"#{1000+i}",
                "total_price": "50.00",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        )
        session.add(raw)
    
    await session.commit()
    print("--- [Mock] Ingested 120 Raw Records ---")
    return {"fetched": 120, "ingested": 120, "errors": 0}

async def monitor_progress(integration_id):
    """
    Polls the DB to show progress updates.
    """
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        while True:
            await asyncio.sleep(0.5)
            # Poll Integration
            res = await session.execute(select(Integration).where(Integration.id == integration_id))
            integration = res.scalar_one_or_none()
            if not integration: break
            
            # Ensure we get fresh data from DB
            await session.refresh(integration)
            
            status = integration.status
            stats = integration.metadata_info.get("sync_stats", {}) if integration.metadata_info else {}
            step = stats.get("current_step")
            msg = stats.get("message")
            processed = stats.get("processed_count")
            eta = stats.get("eta_seconds")
            
            step_str = step.upper() if step else "UNKNOWN"
            print(f"[{step_str}] {msg} | Processed: {processed} | ETA: {eta}s")
             
            
            if step == "complete" or integration.status == IntegrationStatus.ACTIVE:
                # If we are active and step is complete (or not refining), break
                if step != "refining" and step != "fetching":
                    break

async def main():
    # Setup
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        from app.models.shopify.order import ShopifyLineItem
        # Cleanup potential conflict data from previous runs
        # 1. Get IDs of orders to delete (Use shopify_order_id which is the unique/conflict key)
        stmt = select(ShopifyOrder.id).where(ShopifyOrder.shopify_order_id >= 1000, ShopifyOrder.shopify_order_id < 1120)
        order_ids = (await session.execute(stmt)).scalars().all()
        
        print(f"DEBUG: Found {len(order_ids)} existing orders to cleanup.")
        
        if order_ids:
            # 2. Delete Line Items
            stmt_li = delete(ShopifyLineItem).where(ShopifyLineItem.order_id.in_(order_ids))
            res_li = await session.execute(stmt_li)
            # print(f"DEBUG: Deleted {res_li.rowcount} line items.") # asyncpg might not return rowcount easily in all versions
            
            # 3. Delete Orders
            stmt_o = delete(ShopifyOrder).where(ShopifyOrder.id.in_(order_ids))
            await session.execute(stmt_o)
            print("DEBUG: Deleted orders.")
            
        # 4. Delete Raw Ingest
        stmt_raw = delete(ShopifyRawIngest).where(ShopifyRawIngest.shopify_object_id >= 1000, ShopifyRawIngest.shopify_object_id < 1120)
        await session.execute(stmt_raw)
        print("DEBUG: Deleted raw ingest records.")
            
        await session.commit()
    
    async with async_session() as session:
        integration = await create_test_data(session)
        print(f"Created Test Integration: {integration.id}")

    # Patch the real fetcher with our mock
    with patch("app.services.shopify.tasks.shopify_sync_service.fetch_and_ingest_orders", side_effect=mock_fetch_and_ingest):
        
        # Start Monitor in background
        monitor_task = asyncio.create_task(monitor_progress(integration.id))
        
        # Run Sync Task (Main Thread)
        await run_shopify_sync_task(integration.id)
        
        # Wait for monitor
        await monitor_task
        
    # Verification
    async with async_session() as session:
        orders_count = (await session.execute(select(ShopifyOrder).where(ShopifyOrder.integration_id == integration.id))).all()
        print(f"Total Refined Orders in DB: {len(orders_count)}")
        if len(orders_count) == 120:
             print("SUCCESS: All 120 orders refined!")
        else:
             print(f"FAILURE: Expected 120, got {len(orders_count)}")

if __name__ == "__main__":
    asyncio.run(main())
