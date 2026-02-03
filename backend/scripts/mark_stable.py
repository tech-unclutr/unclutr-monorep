import asyncio
import os
import sys
import subprocess
from datetime import datetime

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings

def mark_stable():
    """
    Marks the current codebase and database state as 'stable'.
    1. Dumps the database to backend/stable_db_dump.sql
    2. Tags the git repository with 'stable' (forcing update)
    """
    print("🚀 MARKING SYSTEM AS STABLE...")
    print("-" * 60)

    # 1. Dump Database
    db_url = settings.DATABASE_URL
    # Remove +asyncpg or other drivers for pg_dump
    if "+asyncpg" in db_url:
        clean_db_url = db_url.replace("+asyncpg", "")
    elif "+psycopg2" in db_url:
         clean_db_url = db_url.replace("+psycopg2", "")
    else:
        clean_db_url = db_url
        
    dump_path = os.path.join(os.path.dirname(__file__), '..', 'stable_db_dump.sql')
    dump_path = os.path.abspath(dump_path)

    print(f"\n[1/2] 💾 Dumping database to {dump_path}...")
    
    # Using pg_dump
    # if clean_db_url matches postgresql://user:pass@host:port/db, pg_dump can usually handle it as the dbname arg
    # provided we have permissions.
    
    try:
        # PGPASSWORD might be needed if password is in the URL.
        # However, subprocess environment setup is safer.
        env = os.environ.copy()
        
        # We can just pass the cleanup URL to -d
        cmd = ["pg_dump", "-d", clean_db_url, "-f", dump_path, "--clean", "--if-exists", "--no-owner", "--no-privileges"]
        
        subprocess.run(cmd, check=True, env=env)
        print("✅ Database dump successful.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Database dump failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ An error occurred: {e}")
        sys.exit(1)

    # 2. Tag Git
    print("\n[2/2] 🏷️  Tagging git repository as 'stable'...")
    try:
        subprocess.run(["git", "tag", "-f", "stable"], check=True)
        print("✅ Git tag 'stable' updated.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Git tag failed: {e}")
        # We don't exit here, preserving the dump functionality at least
    
    print("\n" + "=" * 60)
    print("✅ SYSTEM MARKED AS STABLE")
    print("To revert, run: python backend/scripts/revert_stable.py")
    print("=" * 60)

if __name__ == "__main__":
    mark_stable()
