
import asyncio
from sqlalchemy import text
from app.core.db import get_session

async def check_tables():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    print("--- TABLES ---")
    result = await session.exec(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'"))
    tables = result.all()
    for t in tables:
        print(t[0])

    print("\n--- ALEMBIC VERSION ---")
    try:
        version = await session.exec(text("SELECT * FROM alembic_version"))
        print(version.all())
    except Exception as e:
        print(f"Could not read alembic version: {e}")

    await session.close()

if __name__ == "__main__":
    asyncio.run(check_tables())
