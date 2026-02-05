import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from loguru import logger
from sqlalchemy import select

from app.core.db import async_session_factory
from app.models.company import Brand
from app.services.intelligence.insight_engine import insight_engine


async def test_generators():
    logger.info("Initializing Insight Engine...")
    insight_engine._load_generators()
    
    logger.info(f"Loaded {len(insight_engine.generators)} generators.")
    
    # Check if we have 17 (15 Phase 3 + 2 Legacy)
    if len(insight_engine.generators) != 17:
        logger.error(f"❌ Expected 17 generators, found {len(insight_engine.generators)}")
        return
    else:
        logger.info("✅ All 17 generators loaded successfully.")
        
    async with async_session_factory() as session:
        # Get a brand
        result = await session.execute(select(Brand))
        brand = result.scalars().first()
        
        if not brand:
            logger.warning("⚠️ No brand found in DB. Cannot run execution test (Integration Only).")
            return
            
        logger.info(f"Testing execution for Brand: {brand.id}")
        
        # Run all generators
        insights = await insight_engine._run_generators(session, brand.id)
        
        logger.info(f"Generated {len(insights)} raw insights.")
        for i in insights:
            logger.info(f" - [{i.meta.get('category')}] {i.title} (Score: {i.impact_score})")

if __name__ == "__main__":
    asyncio.run(test_generators())
