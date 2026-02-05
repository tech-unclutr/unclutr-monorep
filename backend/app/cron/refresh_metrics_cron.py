import asyncio

from loguru import logger
from sqlmodel import select

from app.core.db import async_session_factory
from app.models.company import Brand
from app.services.brand_service import brand_service


async def refresh_all_brand_metrics():
    """
    Background task to refresh metrics for all active brands.
    Prevents stale data in the 'Bird's Eye' dashboard.
    """
    logger.info("Starting periodic brand metrics refresh...")
    
    async with async_session_factory() as session:
        # Fetch all brands
        stmt = select(Brand)
        brands = (await session.execute(stmt)).scalars().all()
        
        logger.info(f"Found {len(brands)} brands to refresh.")
        
        # Parallel refresh with concurrency limit to avoid DB pressure
        sem = asyncio.Semaphore(5) # Limit to 5 concurrent brand refreshes
        
        async def bounded_refresh(brand_id):
            async with sem:
                try:
                    # Open a fresh session for each brand to avoid state conflicts in gather
                    async with async_session_factory() as local_session:
                        await brand_service.calculate_aggregated_metrics(local_session, brand_id)
                    logger.debug(f"Successfully refreshed metrics for brand {brand_id}")
                except Exception as e:
                    logger.error(f"Failed to refresh metrics for brand {brand_id}: {e}")

        await asyncio.gather(*[bounded_refresh(b.id) for b in brands])

    logger.info("Complete: Periodic brand metrics refresh.")

if __name__ == "__main__":
    asyncio.run(refresh_all_brand_metrics())
