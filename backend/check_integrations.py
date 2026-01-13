import asyncio
from app.core.db import async_session_factory
from app.models.integration import Integration
from sqlmodel import select

async def check_integrations():
    async with async_session_factory() as session:
        result = await session.execute(select(Integration))
        integrations = result.scalars().all()
        print(f'Found {len(integrations)} integrations:')
        for i in integrations:
            print(f'  - {i.id}: {i.datasource_id} ({i.status})')
        return integrations

if __name__ == "__main__":
    integrations = asyncio.run(check_integrations())
