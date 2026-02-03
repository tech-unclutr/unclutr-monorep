import asyncio
import os
import sys
import subprocess

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings

def revert_stable():
    """
    Reverts the database to the 'stable' state from backend/stable_db_dump.sql.
    """
    print("🚀 REVERTING SYSTEM TO STABLE STATE...")
    print("-" * 60)

    # 1. Check for dump file
    dump_path = os.path.join(os.path.dirname(__file__), '..', 'stable_db_dump.sql')
    dump_path = os.path.abspath(dump_path)
    
    if not os.path.exists(dump_path):
        print(f"❌ No stable dump found at {dump_path}.")
        print("Run 'python backend/scripts/mark_stable.py' first.")
        sys.exit(1)

    # 2. Restore Database
    db_url = settings.DATABASE_URL
    if "+asyncpg" in db_url:
        clean_db_url = db_url.replace("+asyncpg", "")
    elif "+psycopg2" in db_url:
         clean_db_url = db_url.replace("+psycopg2", "")
    else:
        clean_db_url = db_url
        
    print(f"\n[1/1] ♻️  Restoring database from {dump_path}...")
    
    try:
        # psql restoration
        # -d connection_string -f file
        # Check if psql is available
        subprocess.run(["psql", "--version"], check=True, stdout=subprocess.DEVNULL)
        
        cmd = ["psql", "-d", clean_db_url, "-f", dump_path]
        
        subprocess.run(cmd, check=True)
        print("✅ Database restored successfully.")
        
    except FileNotFoundError:
        print("❌ 'psql' command not found. Please install PostgreSQL client tools.")
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"❌ Database restore failed: {e}")
        sys.exit(1)
        
    print("\n" + "=" * 60)
    print("✅ DATABASE REVERTED TO STABLE STATE")
    print("ℹ️  To revert CODEBASE to stable tag, run:")
    print("   git reset --hard stable")
    print("=" * 60)

if __name__ == "__main__":
    revert_stable()
