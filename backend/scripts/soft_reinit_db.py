import asyncio
import os
import sys
from sqlmodel import SQLModel, text
from sqlalchemy.ext.asyncio import create_async_engine

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import engine
import app.models 
from scripts.seed_datasources import seed_datasources

async def soft_reinit_db():
    print("🚀 Starting SOFT database re-initialization...")
    
    # List of tables to clear (order matters for foreign keys if not using CASCADE)
    # We'll use TRUNCATE ... CASCADE which is faster but requires Access Exclusive.
    # If it fails, we'll fall back to DELETE FROM ... which only needs Row Exclusive.
    
    tables = [
        "user_call_logs",
        "user_queue_items",
        "queue_item",
        "bolna_execution_map",
        "campaign_event",
        "campaign_lead",
        "campaign",
        "calendar_connection",
        "datasource_config",
        "integration_config",
        "company",
        "user"
    ]
    
    async with engine.begin() as conn:
        print("🧹 Clearing table data...")
        for table in tables:
            try:
                # Try DELETE first as it's most permissive with locks
                await conn.execute(text(f"DELETE FROM {table};"))
                print(f"  ✅ Cleared {table}")
            except Exception as e:
                print(f"  ⚠️  Failed to clear {table}: {e}")
        
    print("✨ Ensuring schema is up to date...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        
    print("🌱 Seeding datasources...")
    await seed_datasources()
    
    print("✅ Soft Database reset complete!")

if __name__ == "__main__":
    asyncio.run(soft_reinit_db())
