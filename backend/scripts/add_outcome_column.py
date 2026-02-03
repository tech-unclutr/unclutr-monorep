import asyncio
import os
import sys
from sqlalchemy import text

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.db import async_session_factory

async def main():
    async with async_session_factory() as session:
        print("[*] Adding 'outcome' column to queue_items table...")
        try:
            await session.execute(text("ALTER TABLE queue_items ADD COLUMN outcome TEXT;"))
            await session.commit()
            print("[*] Column added successfully.")
        except Exception as e:
            print(f"[*] Error (maybe column exists?): {e}")

if __name__ == "__main__":
    asyncio.run(main())
