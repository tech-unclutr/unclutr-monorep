import asyncio
import sys
import os

# Add backend directory to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlmodel import select
from app.core.db import get_session
from app.models.integration import Integration, IntegrationStatus
from app.models.datasource import DataSource

async def reset_shopify():
    # get_session is a generator, we just need one session
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    try:
        # Find Shopify datasource
        statement = select(DataSource).where(DataSource.slug == "shopify")
        results = await session.exec(statement)
        shopify = results.first()
        
        if not shopify:
            print("Shopify datasource not found")
            return

        # Find integrations
        statement = select(Integration).where(Integration.datasource_id == shopify.id)
        results = await session.exec(statement)
        integrations = results.all()
        
        if not integrations:
            print("No Shopify integrations found.")
        
        for integration in integrations:
            print(f"Reseting integration {integration.id} (Status: {integration.status})")
            integration.status = IntegrationStatus.INACTIVE
            integration.credentials = {}
            integration.last_sync_at = None
            session.add(integration)
        
        await session.commit()
        print("Shopify status reset to INACTIVE.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(reset_shopify())
