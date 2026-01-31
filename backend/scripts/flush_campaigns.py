
import asyncio
from sqlalchemy import text
from app.core.db import async_session_factory

async def main():
    async with async_session_factory() as session:
        print("Flushing Campaign Data...")
        
        # Delete from child table first
        await session.execute(text("DELETE FROM campaign_leads"))
        
        # Delete from parent table
        await session.execute(text("DELETE FROM campaigns"))
        
        await session.commit()
        print("Successfully formatted campaign data.")

if __name__ == "__main__":
    asyncio.run(main())
