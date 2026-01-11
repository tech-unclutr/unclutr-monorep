import asyncio
from app.core.db import engine
from sqlalchemy import inspect

async def check_tables():
    def get_tables(connection):
        return inspect(connection).get_table_names()
    
    async with engine.connect() as conn:
        tables = await conn.run_sync(get_tables)
        print("Tables in database:", tables)

if __name__ == "__main__":
    asyncio.run(check_tables())
