import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import engine
from app.models.integration import Integration, IntegrationStatus
from app.services.shopify.sync_service import shopify_sync_service
from app.models.shopify.raw_ingest import ShopifyRawIngest

async def test_sync():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # 1. Find Active Integration
        stmt = select(Integration).where(
            Integration.status == IntegrationStatus.ACTIVE
        )
        result = await session.execute(stmt)
        integration = result.scalars().first()
        
        if not integration:
            print("❌ No Active Integration found. Please connect Shopify in the browser first.")
            return

        print(f"✅ Found Integration: {integration.metadata_info.get('shop')} ({integration.id})")
        
        # 2. Trigger Sync
        print("🚀 Triggering Sync Service...")
        try:
            stats = await shopify_sync_service.fetch_and_ingest_orders(session, integration.id)
            print(f"✅ Sync Complete! Stats: {stats}")
            
            # 3. Verify Data
            cnt_stmt = select(ShopifyRawIngest).where(ShopifyRawIngest.integration_id == integration.id)
            cnt_res = await session.execute(cnt_stmt)
            count = len(cnt_res.scalars().all())
            print(f"📦 Total Rows in shopify_raw_ingest: {count}")
            
        except Exception as e:
            print(f"❌ Sync Failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    # Load env vars
    from dotenv import load_dotenv
    load_dotenv("backend/.env")
    
    asyncio.run(test_sync())
