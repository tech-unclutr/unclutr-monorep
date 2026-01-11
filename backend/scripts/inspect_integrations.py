import asyncio
import uuid
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.models.integration import Integration

async def inspect_integrations():
    async with AsyncSession(engine) as session:
        stmt = select(Integration)
        result = await session.execute(stmt)
        integrations = result.scalars().all()
        
        print(f"Found {len(integrations)} integrations.")
        for i in integrations:
            print(f"\nIntegration ID: {i.id}")
            print(f"Status: {i.status}")
            print(f"Metadata Info: {i.metadata_info}")
            print(f"Last Sync At: {i.last_sync_at}")

if __name__ == "__main__":
    asyncio.run(inspect_integrations())
