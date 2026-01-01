import asyncio
import os
import sys
from sqlmodel import SQLModel

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import engine
# Import central models to register them with SQLModel.metadata
# We import from app.models which imports everything else
import app.models 

# Import the seed function
from scripts.seed_datasources import seed_datasources

async def reinit_db():
    print("⚠️  WARNING: This will DELETE ALL DATA in the database.")
    print("🗑️  Dropping all tables...")
    async with engine.begin() as conn:
        # Use simple drop_all. If foreign keys cause issues, we might need cascade, 
        # but typically ORM drop_all handles order or we assume standard dev setup.
        await conn.run_sync(SQLModel.metadata.drop_all)
    
    print("✨ Creating all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        
    print("🌱 Seeding datasources...")
    # seed_datasources is an async function
    await seed_datasources()
    
    print("✅ Database reset complete! You can now start fresh.")

if __name__ == "__main__":
    asyncio.run(reinit_db())
