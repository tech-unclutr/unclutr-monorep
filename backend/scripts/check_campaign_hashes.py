import asyncio
from sqlalchemy import select, desc
from app.core.db import engine
from app.models.campaign import Campaign

async def check_campaigns():
    async with engine.connect() as conn:
        stmt = select(Campaign).order_by(desc(Campaign.created_at)).limit(5)
        result = await conn.execute(stmt)
        campaigns = result.all()
        
        print(f"{'ID':<40} | {'Name':<30} | {'Created At':<25} | {'Hash'}")
        print("-" * 120)
        for c in campaigns:
            # Note: c is a Row object, access by attribute index or name
            print(f"{str(c.id):<40} | {c.name:<30} | {str(c.created_at):<25} | {c.source_file_hash}")

if __name__ == "__main__":
    asyncio.run(check_campaigns())
