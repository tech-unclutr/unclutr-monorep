import asyncio
from sqlalchemy import text
from app.core.db import engine

async def migrate_columns():
    async with engine.begin() as conn:
        print("Starting column rename...")
        try:
            # Check if columns exist before renaming (to make it somewhat idempotent)
            # stack_summary -> stack_data
            await conn.execute(text("ALTER TABLE company RENAME COLUMN stack_summary TO stack_data;"))
            print("Renamed stack_summary to stack_data")
        except Exception as e:
            print(f"Skipping stack_summary rename: {e}")

        try:
            # channels_summary -> channels_data
            await conn.execute(text("ALTER TABLE company RENAME COLUMN channels_summary TO channels_data;"))
            print("Renamed channels_summary to channels_data")
        except Exception as e:
            print(f"Skipping channels_summary rename: {e}")
        
    print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(migrate_columns())
