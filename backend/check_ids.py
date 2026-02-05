import asyncio
from app.core.db import async_session_factory
from app.models.bolna_execution_map import BolnaExecutionMap
from sqlmodel import select

async def main():
    async with async_session_factory() as session:
        statement = select(BolnaExecutionMap).order_by(BolnaExecutionMap.updated_at.desc()).limit(5)
        result = await session.execute(statement)
        maps = result.scalars().all()
        for m in maps:
            print(f"CallID: {m.bolna_call_id} | Status: {m.call_status} | Campaign: {m.campaign_id}")

if __name__ == "__main__":
    asyncio.run(main())
