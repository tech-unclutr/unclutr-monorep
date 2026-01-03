
import asyncio
from sqlalchemy import text
from app.core.db import get_session

async def reset_db():
    print("WARNING: This will drop ALL tables in the database. 5 seconds to abort...")
    await asyncio.sleep(5)
    
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    print("Dropping public schema...")
    await session.exec(text("DROP SCHEMA public CASCADE"))
    await session.exec(text("CREATE SCHEMA public"))
    await session.exec(text("GRANT ALL ON SCHEMA public TO public"))
    await session.exec(text("COMMENT ON SCHEMA public IS 'standard public schema'"))
    
    await session.commit()
    print("Database flushed. Schema 'public' recreated.")
    await session.close()

if __name__ == "__main__":
    import asyncio
    asyncio.run(reset_db())
