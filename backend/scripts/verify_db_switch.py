import os
import asyncio
import asyncpg
from dotenv import load_dotenv

# Force load the .env file
load_dotenv(dotenv_path="/Users/param/Documents/Unclutr/backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

async def verify():
    print(f"Checking configuration...")
    if "pooler.supabase.com" not in DATABASE_URL:
        print("❌ DATABASE_URL is NOT pointing to Supabase!")
        print(f"Current URL: {DATABASE_URL}")
        return

    print("✅ Configuration points to Supabase.")
    print(f"URL: {DATABASE_URL.split('@')[1]}") # Print host only for security

    try:
        print("\nConnecting to database...")
        # Supabase Transaction Pooler requires statement_cache_size=0 with asyncpg
        conn = await asyncpg.connect(DATABASE_URL, statement_cache_size=0)
        version = await conn.fetchval("SELECT version()")
        print(f"✅ Connected! DB Version: {version}")
        
        user_count = await conn.fetchval("SELECT count(*) FROM \"user\"") # Quote 'user' as it's a keyword
        print(f"✅ User count directly from Supabase: {user_count}")
        
        await conn.close()
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(verify())
