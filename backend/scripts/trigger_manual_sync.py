import asyncio
from sqlmodel import select
from app.models.integration import Integration
from app.core.db import engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.services.shopify.sync_service import shopify_sync_service
from loguru import logger

async def trigger_sync():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        # Get all Shopify integrations
        stmt = select(Integration)
        result = await session.execute(stmt)
        integrations = result.scalars().all()
        
        logger.info(f"Found {len(integrations)} integrations.")
        
        for integration in integrations:
            if not integration.metadata_info or not integration.metadata_info.get("shop"):
                continue
                
            shop = integration.metadata_info.get("shop")
            logger.info(f"Syncing stats for {shop}...")
            
            try:
                # This will backfill orders and UPDATE stats in metadata
                stats = await shopify_sync_service.fetch_and_ingest_orders(session, integration.id)
                logger.info(f"Sync complete for {shop}: {stats}")
            except Exception as e:
                logger.error(f"Sync failed for {shop}: {e}")

if __name__ == "__main__":
    asyncio.run(trigger_sync())
