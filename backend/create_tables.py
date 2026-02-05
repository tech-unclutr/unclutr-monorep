
import asyncio
import sys
import os
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine

# Add backend to path
sys.path.append(os.getcwd())

from app.core.config import settings
from app.models.call_log import CallLog # Import to register with metadata

# Setup DB
engine = create_async_engine(settings.DATABASE_URL, echo=True, future=True)

async def main():
    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    print("Tables created.")

if __name__ == "__main__":
    asyncio.run(main())
