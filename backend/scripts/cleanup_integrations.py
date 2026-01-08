
import asyncio
from sqlmodel import select
from app.core.db import get_session
from app.models.integration import Integration, IntegrationStatus

async def cleanup():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    print("--- RESETTING ALL INTEGRATIONS TO INACTIVE ---")
    stmt = select(Integration)
    result = await session.exec(stmt)
    integrations = result.all()
    
    count = 0
    for i in integrations:
        if i.status != IntegrationStatus.INACTIVE:
            i.status = IntegrationStatus.INACTIVE
            session.add(i)
            count += 1
    
    await session.commit()
    print(f"Successfully reset {count} integrations to INACTIVE.")
    await session.close()

if __name__ == "__main__":
    asyncio.run(cleanup())
