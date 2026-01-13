import asyncio
import sys
sys.path.insert(0, '/Users/param/Documents/Unclutr/backend')

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.models.integration import Integration
from sqlalchemy.orm.attributes import flag_modified

async def reset_sync_stats():
    async with AsyncSession(engine) as session:
        stmt = select(Integration).where(
            Integration.metadata_info['shop'].astext == 'unclutr-dev.myshopify.com'
        )
        result = await session.execute(stmt)
        integration = result.scalars().first()
        
        if integration:
            print(f"Found integration: {integration.id}")
            print(f"Current sync_stats: {integration.metadata_info.get('sync_stats')}")
            
            # Clear sync_stats completely
            if 'sync_stats' in integration.metadata_info:
                del integration.metadata_info['sync_stats']
                flag_modified(integration, 'metadata_info')
                session.add(integration)
                await session.commit()
                print("✅ Cleared sync_stats from integration")
            else:
                print("No sync_stats to clear")
        else:
            print("No integration found")

if __name__ == "__main__":
    asyncio.run(reset_sync_stats())
