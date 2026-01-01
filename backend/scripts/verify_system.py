import asyncio
import os
import sys
from sqlmodel import select, func
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import engine

async def verify_system():
    print("🔍 Verifying System Metrics & Table Usage...")
    
    async with engine.connect() as conn:
        # Get list of all tables
        result = await conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        ))
        tables = [row[0] for row in result.fetchall()]
        
        print("\n📊 Table Row Counts:")
        print("-" * 40)
        print(f"{'Table Name':<30} | {'Rows':<10}")
        print("-" * 40)
        
        used_tables = []
        empty_tables = []
        
        for table in sorted(tables):
            count_result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = count_result.scalar()
            print(f"{table:<30} | {count:<10}")
            
            if count > 0:
                used_tables.append(table)
            else:
                empty_tables.append(table)
                
        print("-" * 40)
        print(f"\n✅ Active Tables: {len(used_tables)}")
        print(f"⚠️  Empty Tables:  {len(empty_tables)}")
        
        # Specific Checks
        if 'metrics' in str(used_tables):
             print("\n📈 Metrics system is initializing.")
        
        print("\nSystem verification complete.")

if __name__ == "__main__":
    asyncio.run(verify_system())
