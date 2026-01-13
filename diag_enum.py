import asyncio
from sqlmodel import select, text
from app.models.integration import Integration, IntegrationStatus
from app.core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession

async def check():
    engine = create_async_engine(settings.DATABASE_URL)
    async with AsyncSession(engine) as session:
        # Check raw values first
        res = await session.execute(text("SELECT id, status FROM integration"))
        raw_rows = res.all()
        print("Raw values in DB:")
        for r in raw_rows:
            print(f"ID: {r.id}, Status: '{r.status}'")
            
        print("\nTrying to load via SQLModel:")
        try:
            res = await session.execute(select(Integration))
            rows = res.scalars().all()
            for r in rows:
                print(f"ID: {r.id}, Status: {r.status}")
        except Exception as e:
            print(f"Failed to load via SQLModel: {e}")

if __name__ == "__main__":
    asyncio.run(check())
