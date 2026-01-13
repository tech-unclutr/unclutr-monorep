import asyncio
import sys
sys.path.insert(0, '/Users/param/Documents/Unclutr/backend')

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.models.integration import Integration

async def check_status():
    async with AsyncSession(engine) as session:
        stmt = select(Integration).where(
            Integration.metadata_info['shop'].astext == 'unclutr-dev.myshopify.com'
        )
        result = await session.execute(stmt)
        integration = result.scalars().first()
        
        if integration:
            print(f"Integration ID: {integration.id}")
            print(f"Status: {integration.status}")
            print(f"Updated: {integration.updated_at}")
            sync_stats = integration.metadata_info.get('sync_stats', {})
            print(f"\nSync Stats:")
            print(f"  current_step: {sync_stats.get('current_step')}")
            print(f"  message: {sync_stats.get('message')}")
            print(f"  progress: {sync_stats.get('progress')}")
        else:
            print("No integration found for unclutr-dev.myshopify.com")

if __name__ == "__main__":
    asyncio.run(check_status())
