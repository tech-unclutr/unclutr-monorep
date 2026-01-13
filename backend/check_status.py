import asyncio
from uuid import UUID
from sqlmodel import select
from app.core.db import async_session_factory
from app.models.integration import Integration

async def check_status():
    async with async_session_factory() as session:
        stmt = select(Integration)
        result = await session.execute(stmt)
        integrations = result.scalars().all()
        for i in integrations:
            print(f"Integration {i.id}:")
            print(f"  Status: {i.status}")
            print(f"  Sync Stats: {i.metadata_info.get('sync_stats')}")

if __name__ == "__main__":
    asyncio.run(check_status())
