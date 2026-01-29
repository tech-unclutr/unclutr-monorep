import asyncio
import sys
import os
from datetime import date, timedelta
from loguru import logger
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker, selectinload
from sqlalchemy import event, text

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models.integration import Integration, IntegrationStatus
from app.services.analytics.service import AnalyticsService

# Create local engine to avoid shared state issues
# Use pool_pre_ping to ensure connections are valid
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True
)

async def main():
    logger.info("Starting Metrics Backfill (Isolated Engine)...")
    logger.info(f"DB URL: {settings.DATABASE_URL}")
    
    # Test connection
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            logger.info("Connection successful!")
    except Exception as e:
        logger.error(f"Connection failed: {e}")
        return

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Get active integrations with eager loading
        stmt = select(Integration).options(selectinload(Integration.datasource)).where(Integration.status == IntegrationStatus.ACTIVE)
        integrations = (await session.execute(stmt)).scalars().all()
        
        if not integrations:
            logger.warning("No active integrations found!")
            return

        for integration in integrations:
            logger.info(f"Backfilling metrics for Integration {integration.id}")
            
            # Backfill last 30 days
            today = date.today()
            for i in range(30):
                target_date = today - timedelta(days=i)
                logger.info(f"  - Generating metrics for {target_date}...")
                
                try:
                    await AnalyticsService.refresh_snapshot(session, integration, target_date)
                    await session.commit()
                except Exception as e:
                    logger.error(f"Failed to generate metrics for {target_date}: {e}")
                    await session.rollback()
            
            logger.info(f"Completed backfill for {integration.id}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
