
import asyncio
import uuid
from sqlmodel import select
from app.core.db import get_session
from app.models.company import Company
from app.models.integration import Integration
from app.models.datasource import DataSource
from app.services.integration_service import _ensure_integrations_sync

async def inspect():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    # Target company
    company_id = uuid.UUID('da74be5a-5a58-48fb-9673-f5a430ae4bc8')
    
    print(f"--- TRIGGERING SYNC FOR COMPANY {company_id} ---")
    await _ensure_integrations_sync(session, company_id)
    print("Sync completed.")

    print("\n--- INTEGRATIONS AFTER SYNC ---")
    stmt = select(Integration).where(Integration.company_id == company_id)
    result = await session.exec(stmt)
    integrations = result.all()
    for i in integrations:
        ds = await session.get(DataSource, i.datasource_id)
        print(f"ID: {i.id}, Status: {i.status}, DataSource: {ds.name if ds else i.datasource_id}")

    await session.close()

if __name__ == "__main__":
    asyncio.run(inspect())
