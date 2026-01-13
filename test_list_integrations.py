import asyncio
from uuid import UUID
from sqlmodel import select
from app.services.integration_service import get_integrations_for_company
from app.core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession

async def test_list():
    engine = create_async_engine(settings.DATABASE_URL)
    async with AsyncSession(engine) as session:
        # Get a real company_id
        from app.models.integration import Integration
        res = await session.execute(select(Integration).limit(1))
        integration = res.scalars().first()
        if not integration:
            print("No integration found")
            return
        
        print(f"Testing list_integrations for company: {integration.company_id}")
        try:
            data = await get_integrations_for_company(session, integration.company_id)
            print(f"Loaded {len(data)} integrations successfully.")
        except Exception as e:
            import traceback
            print("Caught exception:")
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_list())
