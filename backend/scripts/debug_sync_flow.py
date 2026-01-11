
import asyncio
import logging
import sys
from sqlmodel import select
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

# Setup Logging to Console
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', stream=sys.stdout)
logger = logging.getLogger("debug_sync")

# Imports
from app.core.db import engine
from app.models.integration import Integration, IntegrationStatus
from app.services.shopify.sync_service import shopify_sync_service
from app.services.shopify.refinement_service import shopify_refinement_service
from app.core.config import settings

async def debug_run():
    logger.info("Initializing Debug Run...")
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Find all integrations
        stmt = select(Integration)
        all_integrations = (await session.execute(stmt)).scalars().all()
        
        logger.info(f"Found {len(all_integrations)} integrations:")
        target_int = None
        for i in all_integrations:
            shop = i.metadata_info.get('shop') if i.metadata_info else 'N/A'
            logger.info(f" - {i.id} | Status: {i.status} | Shop: {shop}")
            if shop and shop != 'N/A':
                target_int = i
        
        if not target_int:
             logger.error("No valid Shopify integration found.")
             return

        integration = target_int
        logger.info(f"Selected Target: {integration.id}")
        logger.info(f"Shop: {integration.metadata_info.get('shop')}")
        
        # 2. Simulate Sync Execution
        logger.info(">>> STEP 1: Fetching & Ingesting Orders...")
        try:
            stats = await shopify_sync_service.fetch_and_ingest_orders(session, integration.id)
            logger.info(f"Sync Results: {stats}")
            await session.commit()
        except Exception as e:
            logger.error(f"Sync Failed: {e}")
            import traceback
            traceback.print_exc()
            return

        # 3. Simulate Refinement
        logger.info(">>> STEP 2: Refining Data...")
        try:
            await shopify_refinement_service.process_pending_records(session, limit=50)
            logger.info("Refinement Batch Complete")
        except Exception as e:
            logger.error(f"Refinement Failed: {e}")
            import traceback
            traceback.print_exc()

        logger.info("Debug Run Complete.")

if __name__ == "__main__":
    # Ensure settings are loaded
    logger.info(f"Env: {settings.is_production}")
    asyncio.run(debug_run())
