import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.db import async_session_factory
from app.models.integration import Integration
from app.services.shopify.reconciliation_service import shopify_reconciliation_service
from app.models.datasource import DataSource
from sqlmodel import select

async def test_status_update():
    async with async_session_factory() as session:
        # 1. Get first shopify integration
        stmt = select(Integration).join(DataSource).where(DataSource.slug == "shopify").limit(1)
        result = await session.execute(stmt)
        integration = result.scalars().first()
        
        if not integration:
            print("No Shopify integration found.")
            return

        print(f"Testing on Integration: {integration.id}")
        print(f"Initial Metadata: {integration.metadata_info}")

        # 2. Call _update_status
        print("Updating status to 'reconciling'...")
        await shopify_reconciliation_service._update_status(
            session, integration, "Testing Persistence...", step="reconciling", progress=10
        )

        # 3. Re-fetch from DB (fresh session or same session, verify persistence)
        # To be sure, let's use a new session or refresh
        await session.refresh(integration)
        
        print(f"Updated Metadata in Session: {integration.metadata_info.get('sync_stats')}")
        
    # 4. Verify in fresh session
    async with async_session_factory() as session:
        stmt = select(Integration).where(Integration.id == integration.id)
        result = await session.execute(stmt)
        refetched = result.scalars().first()
        
        saved_stats = refetched.metadata_info.get('sync_stats', {})
        print(f"Refetched Sync Stats: {saved_stats}")
        
        if saved_stats.get('message') == "Testing Persistence...":
            print("✅ SUCCESS: Status persisted correctly.")
        else:
            print("❌ FAILURE: Status did NOT persist.")

if __name__ == "__main__":
    asyncio.run(test_status_update())
