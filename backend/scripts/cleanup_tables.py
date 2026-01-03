
import asyncio
from sqlalchemy import text
from app.core.db import get_session

async def cleanup_tables():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    tables_to_drop = [
        "company_membership", 
        "workspace_membership", 
        "company_entitlement"
    ]
    
    for t in tables_to_drop:
        print(f"Dropping {t}...")
        await session.exec(text(f"DROP TABLE IF EXISTS {t} CASCADE"))
    
    await session.commit()
    print("Cleanup done.")
    await session.close()

if __name__ == "__main__":
    asyncio.run(cleanup_tables())
