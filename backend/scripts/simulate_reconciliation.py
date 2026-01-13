import asyncio
import sys
import os
from uuid import UUID
from datetime import datetime, timezone

# Add backend to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, backend_dir)
os.chdir(backend_dir) # Ensure we are in backend for relative imports to work if any

from app.core.db import engine
from app.models.integration import Integration
from app.services.shopify.reconciliation_service import shopify_reconciliation_service
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

async def simulate_reconciliation(integration_id: str):
    print(f"🚀 Starting Simulated Reconciliation for {integration_id}")
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Check Integration
        integration = await session.get(Integration, integration_id)
        if not integration:
            print(f"❌ Integration {integration_id} not found")
            return

        print(f"Found Integration: {integration.id} for shop: {integration.metadata_info.get('shop')}")
        
        try:
            # We will call the logic directly
            # Note: shopify_reconciliation_service.reconcile_integration will update status in DB
            await shopify_reconciliation_service.reconcile_integration(session, integration)
            print("✅ Simulation Finished Successfully")
        except Exception as e:
            print(f"❌ Simulation Failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    integ_id = "7e6126cb-5857-4090-93c1-cc00f4e2de90"
    asyncio.run(simulate_reconciliation(integ_id))
