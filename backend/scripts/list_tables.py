import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def list_tables():
    engine = create_async_engine("postgresql+asyncpg://param@localhost:5432/postgres")
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = result.fetchall()
        for table in tables:
            print(table[0])

if __name__ == "__main__":
    asyncio.run(list_tables())
