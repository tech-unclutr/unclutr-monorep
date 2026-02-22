import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import json

# Load DATABASE_URL from .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in .env")

async def check_db():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(text("SELECT credentials FROM calendar_connection LIMIT 5"))
        rows = result.fetchall()
        for row in rows:
            print(json.dumps(row[0], indent=2))
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_db())
