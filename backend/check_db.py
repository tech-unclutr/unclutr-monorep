import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import json

DATABASE_URL = "postgresql+asyncpg://postgres.wtcowhmuzapnrkczuvzh:My1stcompanynamewasRentEase@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

async def check_db():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(text("SELECT credentials FROM calendar_connection LIMIT 5"))
        rows = result.fetchall()
        for row in rows:
            print(json.dumps(row[0], indent=2))
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_db())
