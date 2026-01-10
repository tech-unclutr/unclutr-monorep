import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.db import get_session
from sqlmodel import select
from app.models.integration import Integration
from app.models.datasource import DataSource

async def main():
    async for session in get_session():
        print("Checking Integrations...")
        
        # Get Shopify ID
        ds_stmt = select(DataSource).where(DataSource.name == "Shopify")
        ds_result = await session.execute(ds_stmt)
        shopify_ds = ds_result.scalars().first()
        
        if not shopify_ds:
            print("ERROR: Shopify DataSource not found in DB!")
            return

        print(f"Shopify DataSource ID: {shopify_ds.id}")

        # Get Integrations
        stmt = select(Integration).where(Integration.datasource_id == shopify_ds.id)
        result = await session.execute(stmt)
        integrations = result.scalars().all()
        
        if not integrations:
            print("No Shopify integrations found.")
        else:
            for i in integrations:
                print(f"FOUND INTEGRATION: ID={i.id}, Company={i.company_id}, Status={i.status}")
                print(f"Credentials (Shop): {i.credentials.get('shop')}")
                print(f"Metadata: {i.metadata_info}")

if __name__ == "__main__":
    asyncio.run(main())
