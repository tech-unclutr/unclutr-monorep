
import asyncio
from datetime import date, timedelta, datetime, timezone
from uuid import UUID
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.models.integration import Integration
from app.services.analytics.service import AnalyticsService
from sqlmodel import select

async def backfill():
    async with AsyncSession(engine) as session:
        # Get active integration
        stmt = select(Integration).where(Integration.status == "active").limit(1)
        integration = (await session.exec(stmt)).first()
        
        if not integration:
            print("No active integration found")
            return
            
        print(f"Backfilling metrics for integration {integration.id}")
        today = date.today()
        for i in range(31):
            target_date = today - timedelta(days=i)
            print(f" - Processing {target_date}...")
            try:
                # Re-fetch integration to ensure it's in the session and has no stale relationships
                stmt = select(Integration).where(Integration.status == "active").limit(1)
                integration = (await session.exec(stmt)).first()
                
                await AnalyticsService.refresh_snapshot(session, integration, target_date)
                await session.commit()
            except Exception as e:
                print(f"   Error for {target_date}: {e}")
                import traceback
                traceback.print_exc()
                await session.rollback()
        
        print("Done!")

if __name__ == "__main__":
    asyncio.run(backfill())
