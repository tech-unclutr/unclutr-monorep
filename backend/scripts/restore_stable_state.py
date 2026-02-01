import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlmodel import SQLModel
from app.core.db import engine, init_db
import app.models  # Register all models

# Import necessary seeding functions
from scripts.seed_datasources import seed_datasources
from scripts.seed_dev import seed_data as seed_dev_fixtures
from setup_dev_auth import setup_dev_user
from scripts.seed_module_3_data import seed_module_3_data
from scripts.seed_phase2 import seed_phase2_data

async def restore_stable_state():
    """
    Unified script to restore the database to the 'last stable completely filled' state.
    This wipes the database and runs all seeders in the correct sequence.
    """
    print("🚀 STARTING FULL DATABASE RESTORATION TO STABLE STATE...")
    print("-" * 60)

    # 1. Wipe and Recreate Schema (including Types/Enums)
    print("\n[1/6] 🗑️  Dropping and recreating public schema...")
    from sqlalchemy import text
    async with engine.begin() as conn:
        await conn.execute(text("DROP SCHEMA public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
        await conn.execute(text("COMMENT ON SCHEMA public IS 'standard public schema'"))
    
    print("[2/6] ✨ Creating all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    # 2. Seed DataSources
    print("\n[3/6] 🌱 Seeding datasources...")
    await seed_datasources()
    
    # 3. Seed Permissions and Modules
    print("\n[4/6] 🔑 Seeding dev fixtures (permissions/modules)...")
    await seed_dev_fixtures()
    
    # 4. Setup Dev User and Company
    print("\n[5/6] 👤 Setting up Dev User & Company...")
    await setup_dev_user()
    
    # 5. Populate Mock Shopify Data (Products, Variants, Inventory)
    print("\n[6/6] 🧪 Seeding stable mock Shopify data...")
    # Seed Module 3 data (Product, Variant, Location, Inventory)
    await seed_module_3_data()
    # Seed Phase 2 data (Costs, Orders for the stable brand)
    await seed_phase2_data()

    print("\n" + "=" * 60)
    print("✅ DATABASE RESTORED TO STABLE COMPLETELY FILLED STATE")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(restore_stable_state())
