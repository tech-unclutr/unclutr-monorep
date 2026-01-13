import asyncio
import uuid
from app.core.db import async_session_factory
from app.models.integration import Integration
from sqlmodel import select

async def find_integration_owner():
    async with async_session_factory() as session:
        int_id = uuid.UUID("549182a3-fbd2-475b-92ba-32124ca2c902")
        integration = await session.get(Integration, int_id)
        if integration:
            print(f"Integration {int_id} belongs to Company: {integration.company_id}")
        else:
            print("Integration not found.")

if __name__ == "__main__":
    asyncio.run(find_integration_owner())
