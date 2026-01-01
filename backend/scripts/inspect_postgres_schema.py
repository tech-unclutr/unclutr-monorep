import asyncio
from sqlalchemy import inspect, text
from app.core.db import engine

async def inspect_schema():
    async with engine.connect() as conn:
        def get_columns(connection):
            inspector = inspect(connection)
            return inspector.get_columns("onboardingstate")

        columns = await conn.run_sync(get_columns)
        print(f"Found {len(columns)} columns in 'onboardingstate':")
        for col in columns:
            print(f" - {col['name']} ({col['type']})")

if __name__ == "__main__":
    asyncio.run(inspect_schema())
