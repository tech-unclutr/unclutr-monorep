
import asyncio
import sys
import os
from sqlalchemy import text
from uuid import UUID

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import get_session

TARGET_EMAIL = "tech.unclutr@gmail.com"
TARGET_COMPANY_ID = "a953f1d7-f0a8-49b3-a6f4-c9fbcf774b48"

async def selective_purge():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    print("⚠️  STARTING SELECTIVE DATABASE PURGE ⚠️")
    print(f"Preserving all data for: {TARGET_EMAIL} / Company: {TARGET_COMPANY_ID}")
    print("-" * 50)

    try:
        # 1. Get all tables in public schema
        result = await session.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
        tables = [row[0] for row in result.all()]
        
        # 2. Identify tables with company_id column
        company_tables_result = await session.execute(text(
            "SELECT table_name FROM information_schema.columns "
            "WHERE column_name = 'company_id' AND table_schema = 'public'"
        ))
        company_tables = [row[0] for row in company_tables_result.all()]
        
        # 3. Clean up company-linked tables
        for table in company_tables:
            if table == 'company':
                continue # Handle separately
            print(f"Purging {table} (company_id != {TARGET_COMPANY_ID})...")
            await session.execute(text(f'DELETE FROM "{table}" WHERE company_id != :cid'), {"cid": TARGET_COMPANY_ID})
            
        # 4. Clean up Workspace/Brand (indirectly linked or direct)
        # Note: workspace and brand appeared in company_tables list already.
        
        # 5. Clean up User Table
        print(f"Purging user table (email != {TARGET_EMAIL})...")
        await session.execute(text('DELETE FROM "user" WHERE email != :email'), {"email": TARGET_EMAIL})
        
        # 6. Clean up Company Table
        print(f"Purging company table (id != {TARGET_COMPANY_ID})...")
        await session.execute(text('DELETE FROM "company" WHERE id != :cid'), {"cid": TARGET_COMPANY_ID})
        
        # 7. Update User Settings
        print("Updating user settings...")
        await session.execute(text(
            'UPDATE "user" SET settings = :settings WHERE email = :email'
        ), {"settings": '{"intelligence_unlocked": true}', "email": TARGET_EMAIL})
        
        # 8. Clean up Orphaned/Special tables
        # alembic_version (leave alone)
        # audit_trail (already handled if it has company_id, but let's check)
        
        # Special check for tables without company_id that might have stray data
        # For simplicity, if a table wasn't in the company_tables list and isn't a core table, 
        # we might want to truncate it if it's safe (e.g. logs).
        # But per plan "delete all data NOT associated", if we can't link it, and it's not the target user, 
        # we should probably truncate it if it's not a reference/schema table.
        
        core_preserved = ['user', 'company', 'brand', 'workspace', 'alembic_version']
        for table in tables:
            if table not in company_tables and table not in core_preserved:
                print(f"Truncating non-linked table: {table}...")
                await session.execute(text(f'TRUNCATE TABLE "{table}" CASCADE'))

        await session.commit()
        print("-" * 50)
        print("✅ Selective purge complete.")
        
    except Exception as e:
        print(f"❌ Error during purge: {e}")
        await session.rollback()
    
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(selective_purge())
