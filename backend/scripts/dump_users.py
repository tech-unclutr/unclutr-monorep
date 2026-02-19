
import asyncio
import os
import sys
from sqlmodel import select
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import engine

async def dump_users():
    print("🔍 Dumping All Users...")
    
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT id, email, current_company_id FROM \"user\""))
        rows = result.fetchall()
        
        if not rows:
            print("❌ No users found in DB.")
        
        for row in rows:
            print(f"User: {row.email} | ID: {row.id} | Company: {row.current_company_id}")

        print(f"\nTotal Users: {len(rows)}")

if __name__ == "__main__":
    asyncio.run(dump_users())
