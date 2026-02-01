
import asyncio
from sqlalchemy import select, desc
from app.core.db import engine
from app.models.campaign import Campaign
from sqlalchemy import text

async def check_campaigns():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT id, name, created_at, status FROM campaigns ORDER BY created_at DESC"))
        rows = result.fetchall()
        print(f"Total Campaigns: {len(rows)}")
        for row in rows:
            print(f"ID: {row.id}, Name: '{row.name}', Status: {row.status}, Created: {row.created_at}")

if __name__ == "__main__":
    asyncio.run(check_campaigns())
