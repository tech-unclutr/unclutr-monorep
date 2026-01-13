import asyncio
from sqlmodel import select
from app.core.db import get_session
from app.models.datasource import DataSource

async def check():
    session_gen = get_session()
    session = await session_gen.__anext__()
    result = await session.execute(select(DataSource))
    datasources = result.scalars().all()
    for d in datasources:
        print(f"NAME: '{d.name}', SLUG: '{d.slug}', ID: '{d.id}'")
    await session.close()

if __name__ == "__main__":
    asyncio.run(check())
