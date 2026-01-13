
import asyncio
import logging
import sys
from sqlmodel import select
from app.core.db import async_session_factory
from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.services.shopify.refinement_service import shopify_refinement_service

# Setup Logging
logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger("debug_refinement")

async def reprocess_products():
    async with async_session_factory() as session:
        # 1. Find processed products
        stmt = select(ShopifyRawIngest).where(
            ShopifyRawIngest.object_type == "product",
            ShopifyRawIngest.processing_status == "processed"
        ).limit(1)
        
        record = (await session.execute(stmt)).scalars().first()
        
        if not record:
            logger.info("No processed product records found to reprocess.")
            return

        logger.info(f"Resetting record {record.id} (Product ID: {record.payload.get('id')}) to Pending")
        
        # 2. Reset to Pending
        record.processing_status = "pending"
        session.add(record)
        await session.commit()
        
        # 3. Trigger Refinement
        logger.info("Triggering Refinement...")
        await shopify_refinement_service.process_pending_records(session, limit=1)
        await session.commit()
        
        logger.info("Refinement Complete.")

if __name__ == "__main__":
    asyncio.run(reprocess_products())
