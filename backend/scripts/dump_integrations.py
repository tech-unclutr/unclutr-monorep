import asyncio
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker
from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.integration import Integration

async def dump_integrations():
    async_session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session_factory() as session:
        res = await session.execute(select(Integration))
        rows = res.scalars().all()
        for r in rows:
            print(f"ID: {r.id} | Status: {r.status} | Metadata: {r.metadata_info}")

if __name__ == "__main__":
    asyncio.run(dump_integrations())
