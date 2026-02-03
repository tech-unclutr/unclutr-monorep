import asyncio
import sys
import os

# Add app to path
sys.path.append(os.getcwd())

from app.core.db import engine
from sqlmodel import SQLModel
# Import all models to ensure they are registered
import app.models 
# Explicitly import Integration if it's not in app.models
# Checking file structure...
try:
    from app.models.integration import Integration
    print("Imported Integration model")
except ImportError:
    print("Could not import Integration model directly")

async def fix_schema():
    print("🔄 Checking for missing tables and creating them...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    print("✅ Schema sync complete.")

if __name__ == "__main__":
    asyncio.run(fix_schema())
