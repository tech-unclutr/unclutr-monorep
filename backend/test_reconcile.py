import asyncio
import uuid
import pytest
from sqlmodel import select
from app.core.db import async_session_factory
from app.models.integration import Integration
from app.services.shopify.reconciliation_service import shopify_reconciliation_service

@pytest.mark.asyncio
async def test_reconcile():
    integration_id = uuid.UUID("6f24147f-2591-4b7f-ad08-10c7ec0c76ac")
    async with async_session_factory() as session:
        integration = await session.get(Integration, integration_id)
        if not integration:
            print("Integration not found")
            return
        
        print(f"Starting reconciliation for {integration_id}...")
        try:
            await shopify_reconciliation_service.reconcile_integration(session, integration)
            print("Reconciliation finished successfully!")
        except Exception as e:
            print(f"Reconciliation failed with error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_reconcile())
