
import asyncio
import os
import sys
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import engine

async def list_enums():
    print("🔍 Listing Enums...")
    async with engine.connect() as conn:
        result = await conn.execute(text("""
            SELECT t.typname, e.enumlabel
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = 'systemrole'
        """))
        rows = result.fetchall()
        for r in rows:
            print(f"Enum: {r.typname} | Value: {r.enumlabel}")

if __name__ == "__main__":
    asyncio.run(list_enums())
