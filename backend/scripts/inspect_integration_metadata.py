
import asyncio
from sqlmodel import select
from app.core.db import async_session_factory
from app.models.integration import Integration

async def main():
    async with async_session_factory() as session:
        print("Inspecting Integrations Metadata...")
        stmt = select(Integration)
        result = await session.execute(stmt)
        integrations = result.scalars().all()
        
        for integ in integrations:
            print(f"ID: {integ.id} | Status: {integ.status} | Shop: {integ.metadata_info.get('shop')}")
            print(f"Stats: {integ.metadata_info.get('sync_stats')}")
            print("-" * 40)

if __name__ == "__main__":
    asyncio.run(main())
