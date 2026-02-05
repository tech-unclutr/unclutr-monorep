import asyncio
import os
import sys
from sqlmodel import SQLModel

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import engine
import app.models 

async def create_tables():
    print("✨ Creating all tables (Empty)...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    print("✅ Tables created.")

if __name__ == "__main__":
    asyncio.run(create_tables())
