import asyncio
from uuid import UUID
from sqlmodel import select
from app.models.campaign import Campaign
from app.core.db import async_session_factory

async def check():
    async with async_session_factory() as session:
        statement = select(Campaign)
        result = await session.execute(statement)
        campaigns = result.scalars().all()
        for c in campaigns:
            config = c.execution_config or {}
            print(f"Campaign {c.id} ({c.name}): max_concurrent_calls = {config.get('max_concurrent_calls')}")

if __name__ == "__main__":
    asyncio.run(check())
