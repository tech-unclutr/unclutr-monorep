
import asyncio
from sqlalchemy import text
from app.core.db import get_session

async def check_counts():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    tables = [
        "companymembership", "company_membership",
        "workspacemembership", "workspace_membership",
        "companyentitlement", "company_entitlement"
    ]
    
    for t in tables:
        try:
            result = await session.exec(text(f"SELECT count(*) FROM {t}"))
            print(f"{t}: {result.first()[0]}")
        except Exception as e:
            print(f"{t}: Error {e}")
            
    await session.close()

if __name__ == "__main__":
    asyncio.run(check_counts())
