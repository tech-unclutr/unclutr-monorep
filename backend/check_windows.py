import asyncio
from uuid import UUID
from sqlalchemy import select
from app.core.db import get_session
from app.models.campaign import Campaign

async def check():
    session_gen = get_session()
    session = await session_gen.__anext__()
    try:
        stmt = select(Campaign).order_by(Campaign.created_at.desc()).limit(5)
        result = await session.execute(stmt)
        campaigns = result.scalars().all()
        for c in campaigns:
            print(f"ID: {c.id}, Name: {c.name}, Windows: {c.execution_windows}")
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(check())
