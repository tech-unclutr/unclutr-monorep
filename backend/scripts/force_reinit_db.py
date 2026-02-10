import asyncio
import os
import sys
from sqlmodel import SQLModel, text
from sqlalchemy.ext.asyncio import create_async_engine

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import engine, DATABASE_URL
import app.models 
from scripts.seed_datasources import seed_datasources

async def force_reinit_db():
    print("🚀 Starting FORCE database re-initialization...")
    
    # Use a separate engine for management to avoid being killed ourselves if we use the same connection
    async with engine.connect() as conn:
        print("🔗 Terminating other connections...")
        try:
            # Kill all other sessions on this database
            await conn.execute(text("""
                SELECT pg_terminate_backend(pid) 
                FROM pg_stat_activity 
                WHERE datname = 'postgres' 
                  AND pid <> pg_backend_pid();
            """))
            await conn.commit()
            print("💀 Terminated other connections.")
        except Exception as e:
            print(f"⚠️  Could not terminate connections (might not have permissions): {e}")

    print("🗑️  Dropping all tables with CASCADE...")
    async with engine.begin() as conn:
        # We'll try to drop tables one by one with cascade or just use the metadata
        # Since SQLModel doesn't easily do CASCADE in drop_all, we'll do it manually for the problematic ones
        try:
            await conn.execute(text("DROP TABLE IF EXISTS user_call_logs CASCADE;"))
            await conn.execute(text("DROP TABLE IF EXISTS user_queue_items CASCADE;"))
            await conn.execute(text("DROP TABLE IF EXISTS campaign_leads CASCADE;"))
            print("🚀 Problematic tables dropped.")
        except Exception as e:
            print(f"⚠️  Manual drop failed: {e}")
            
        print("🔧 Running metadata drop_all...")
        await conn.run_sync(SQLModel.metadata.drop_all)
    
    print("✨ Creating all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        
    print("🌱 Seeding datasources...")
    await seed_datasources()
    
    print("✅ Force Database reset complete!")

if __name__ == "__main__":
    asyncio.run(force_reinit_db())
