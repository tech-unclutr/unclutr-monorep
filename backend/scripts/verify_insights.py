import asyncio
import sys
import os
from uuid import UUID

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.services.intelligence.generators.velocity_generator import VelocityGenerator
from app.models.company import Workspace, Brand

# Use the same setup as before
engine = create_async_engine(settings.DATABASE_URL, echo=False)

from loguru import logger

async def main():
    logger.info("Verifying VelocityGenerator...")
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Get a brand
        stmt = select(Brand).limit(1)
        brand = (await session.execute(stmt)).scalar_one_or_none()
        
        if not brand:
            logger.error("No brand found!")
            return
            
        logger.info(f"Testing for Brand: {brand.id}")
        
        gen = VelocityGenerator()
        insight = await gen.run(session, brand.id)
        
        if insight:
            logger.success("SUCCESS: Insight Generated!")
            logger.info(f"Title: {insight.title}")
            logger.info(f"Description: {insight.description}")
            logger.info(f"Impact Score: {insight.impact_score}")
            logger.info(f"Cold Start: {insight.meta.get('days_analyzed') < 14}")
        else:
            logger.error("FAILURE: No insight generated.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
