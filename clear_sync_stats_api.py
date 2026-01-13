import asyncio
import sys
sys.path.insert(0, '/Users/param/Documents/Unclutr/backend')

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.models.integration import Integration
from sqlalchemy.orm.attributes import flag_modified

async def clear_all_sync_stats():
    async with AsyncSession(engine) as session:
        stmt = select(Integration)
        result = await session.execute(stmt)
        integrations = result.scalars().all()
        
        for integration in integrations:
            if integration.metadata_info and 'sync_stats' in integration.metadata_info:
                # Remove the entire sync_stats key
                del integration.metadata_info['sync_stats']
                flag_modified(integration, 'metadata_info')
                session.add(integration)
                print(f"Cleared sync_stats for integration {integration.id}")
        
        await session.commit()
        print("✅ All sync_stats cleared from all integrations")

if __name__ == "__main__":
    asyncio.run(clear_all_sync_stats())
