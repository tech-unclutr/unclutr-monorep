import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.db import async_session_factory
from app.models.integration import Integration
from app.models.datasource import DataSource
from sqlmodel import select

async def inspect_all_integrations():
    async with async_session_factory() as session:
        # Get ALL shopify integrations
        stmt = select(Integration).join(DataSource).where(DataSource.slug == "shopify")
        result = await session.execute(stmt)
        integrations = result.scalars().all()
        
        print(f"Found {len(integrations)} Shopify Integration(s).")
        
        for idx, integration in enumerate(integrations):
            sync_stats = integration.metadata_info.get('sync_stats', {})
            print(f"[{idx+1}] ID: {integration.id} | Status: {integration.status}")
            print(f"    Message: {sync_stats.get('message')}")
            print(f"    Step: {sync_stats.get('current_step')}")
            print("-" * 40)

if __name__ == "__main__":
    asyncio.run(inspect_all_integrations())
