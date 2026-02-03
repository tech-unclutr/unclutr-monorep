import asyncio
from sqlalchemy import text
from app.core.db import engine
from app.core.db_repair import ensure_column_exists
from app.models.campaign import Campaign

async def heal_schema():
    print("Running manual schema repair...")
    async with engine.begin() as conn:
        # Manually ensure execution_config exists
        # It's a JSONB column in the model
        await ensure_column_exists(conn, "campaigns", "execution_config", "JSONB", "'{}'")
        
        # Also ensure source_file_hash exists as it was also added in the model update
        await ensure_column_exists(conn, "campaigns", "source_file_hash", "VARCHAR")

        # Ensure meta_data exists
        await ensure_column_exists(conn, "campaigns", "meta_data", "JSONB", "'{}'")
        
    print("Schema repair complete.")

if __name__ == "__main__":
    asyncio.run(heal_schema())
