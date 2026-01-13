import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.db import async_session_factory
from app.models.integration import Integration
from app.models.datasource import DataSource
from sqlmodel import select
from datetime import datetime, timezone

async def force_reset():
    async with async_session_factory() as session:
        # Get the specific integration we found
        stmt = select(Integration).where(Integration.id == "7e6126cb-5857-4090-93c1-cc00f4e2de90")
        result = await session.execute(stmt)
        integration = result.scalars().first()
        
        if not integration:
            print("Integration not found!")
            return

        print(f"Before Reset: {integration.metadata_info.get('sync_stats')}")
        
        # Deep copy to ensure mutation is tracked
        new_metadata = integration.metadata_info.copy()
        new_stats = new_metadata.get('sync_stats', {}).copy()
        
        # Wipe it
        new_stats['current_step'] = 'idle'
        new_stats['message'] = None
        new_stats['progress'] = 0
        new_stats['last_updated'] = datetime.now(timezone.utc).isoformat()
        
        new_metadata['sync_stats'] = new_stats
        integration.metadata_info = new_metadata
        
        session.add(integration)
        await session.commit()
        await session.refresh(integration)
        
        print(f"After Reset: {integration.metadata_info.get('sync_stats')}")

if __name__ == "__main__":
    asyncio.run(force_reset())
