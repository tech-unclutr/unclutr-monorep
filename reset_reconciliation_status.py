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

async def reset_status():
    async with async_session_factory() as session:
        # Get the shopify integration
        stmt = select(Integration).join(DataSource).where(DataSource.slug == "shopify").limit(1)
        result = await session.execute(stmt)
        integration = result.scalars().first()
        
        if not integration:
            print("No Shopify integration found.")
            return

        print(f"Resetting Integration: {integration.id}")
        
        # Reset sync_stats
        current_metadata = integration.metadata_info or {}
        sync_stats = current_metadata.get('sync_stats', {})
        
        # Force it to a clean state
        sync_stats['current_step'] = 'idle'
        sync_stats['message'] = None 
        sync_stats['progress'] = 0
        sync_stats['last_updated'] = datetime.now(timezone.utc).isoformat()
        
        current_metadata['sync_stats'] = sync_stats
        integration.metadata_info = current_metadata
        
        # Also ensure status is active if it was stuck syncing (optional, but good for cleanup)
        # integration.status = "active" 

        session.add(integration)
        await session.commit()
        
        print("✅ Status reset to IDLE.")

if __name__ == "__main__":
    asyncio.run(reset_status())
