
import asyncio
import sys
import os
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import get_session

async def reset_user_data():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    print("⚠️  STARTING COMPREHENSIVE DATA RESET ⚠️")
    print("This will permanently delete ALL data in the public schema.")
    print("-" * 50)

    # Query all tables in the public schema
    result = await session.exec(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
    all_tables = [row[0] for row in result.all()]
    
    # Filter out alembic_version to preserve migration state
    tables_to_truncate = [t for t in all_tables if t != 'alembic_version']
    
    if not tables_to_truncate:
        print("⚠️  No tables found to truncate.")
        await session.close()
        return

    quoted_tables = [f'"{t}"' for t in tables_to_truncate]
    truncate_query = f"TRUNCATE TABLE {', '.join(quoted_tables)} CASCADE;"
    
    try:
        print(f"Truncating {len(tables_to_truncate)} tables...")
        await session.exec(text(truncate_query))
        await session.commit()
        print("✅ Data reset complete.")
        
    except Exception as e:
        print(f"❌ Error during reset: {e}")
        await session.rollback()
    
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(reset_user_data())
