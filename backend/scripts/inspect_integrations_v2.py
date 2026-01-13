import asyncio
import sys
import os
from sqlmodel import select
from uuid import UUID
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.core.db import get_session
from app.models.integration import Integration
from app.models.company import Company

async def main():
    async for session in get_session():
        # Find company (assuming only one for now or taking first active)
        stmt = select(Company)
        res = await session.execute(stmt)
        companies = res.scalars().all()
        
        for company in companies:
            print(f"\n--- Company: {company.brand_name} ({company.id}) ---")
            
            # Find integrations
            int_stmt = select(Integration).where(Integration.company_id == company.id)
            int_res = await session.execute(int_stmt)
            integrations = int_res.scalars().all()
            
            print(f"Integrations Found: {len(integrations)}")
            for i in integrations:
                print(f"  - ID: {i.id}")
                print(f"    Datasource: {i.datasource_id}")
                print(f"    Status: {i.status}")
                print(f"    Config: {i.config}")
                print(f"    Error: {i.error_message}")
                print(f"    Last Sync: {i.last_sync_at}")
        
        break

if __name__ == "__main__":
    asyncio.run(main())
