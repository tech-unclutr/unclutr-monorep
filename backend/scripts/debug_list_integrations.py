import asyncio
import uuid
from app.core.db import async_session_factory
from app.services import integration_service

async def custom_get_integrations():
    async with async_session_factory() as session:
        # Use the CORRECT Company ID found via debug_find_owner.py
        company_id = uuid.UUID("0e5cc844-9556-4dd7-a2e7-323fc937744d")
        
        print(f"Fetching integrations for company: {company_id}")
        integrations = await integration_service.get_integrations_for_company(session, company_id)
        
        print(f"Found {len(integrations)} integrations.")
        for i in integrations:
            print(f"ID: {i['id']}")
            print(f"Status: {i['status']}")
            print(f"Slug: {i.get('datasource', {}).get('slug')}")
            stats = i.get('metadata_info', {}).get('sync_stats', {})
            print(f"Stats: {stats}")
            print("-" * 20)

if __name__ == "__main__":
    asyncio.run(custom_get_integrations())
