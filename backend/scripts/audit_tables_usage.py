
import asyncio
import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.core.db import get_session

async def audit_tables():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    # Get all table names
    # PostgreSQL specific query
    query = text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    try:
        result = await session.exec(query)
        tables = result.all()
    except Exception as e:
        # Fallback for SQLite if using SQLite
        try:
             result = await session.exec(text("SELECT name FROM sqlite_master WHERE type='table';"))
             tables = result.all()
        except:
             print(f"Error getting tables: {e}")
             return

    print(f"Found {len(tables)} tables.")
    
    unused_candidates = []
    
    for table_row in tables:
        t = table_row[0]
        # Skip alembic_version
        if t == "alembic_version":
            continue
            
        try:
            count_result = await session.exec(text(f"SELECT COUNT(*) FROM {t}"))
            count = count_result.one()[0]
            print(f"Table: {t:<30} Rows: {count}")
            if count == 0:
                unused_candidates.append(t)
        except Exception as e:
            print(f"Error counting {t}: {e}")
            
    print("\nPotential unused tables (0 rows):")
    for t in unused_candidates:
        print(f"- {t}")

    await session.close()

if __name__ == "__main__":
    asyncio.run(audit_tables())
