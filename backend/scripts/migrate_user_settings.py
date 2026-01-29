import asyncio
import sys
import os
from sqlalchemy import text

# Add backend to path - assuming we run from 'backend/' root
sys.path.append(os.getcwd())

from app.core.db import async_session_factory

async def migrate():
    print("🛠 Migrating User Table: Adding 'settings' column...")
    async with async_session_factory() as session:
        try:
            # Check if column exists
            result = await session.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='user' AND column_name='settings'"
            ))
            if result.scalar():
                print("ℹ️ Column 'settings' already exists.")
                return

            # Add column
            await session.execute(text("ALTER TABLE \"user\" ADD COLUMN settings JSONB DEFAULT '{}'"))
            await session.commit()
            print("✅ Successfully added 'settings' column.")
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(migrate())
