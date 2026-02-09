import asyncio
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.future import select
from app.models.call_raw_data import CallRawData
from app.core.config import settings

async def inspect_raw_data():
    engine = create_async_engine(settings.DATABASE_URL)
    async with AsyncSession(engine) as session:
        stmt = select(CallRawData).order_by(CallRawData.created_at.desc()).limit(1)
        result = await session.execute(stmt)
        entry = result.scalars().first()
        if entry:
            print(json.dumps(entry.payload, indent=2))
        else:
            print("No raw data found.")

if __name__ == '__main__':
    asyncio.run(inspect_raw_data())
