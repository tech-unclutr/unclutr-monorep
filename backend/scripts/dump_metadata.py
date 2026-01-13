import asyncio
import uuid
import json
from app.core.db import async_session_factory
from app.models.integration import Integration
from sqlmodel import select

async def dump_metadata():
    async with async_session_factory() as session:
        int_id = uuid.UUID("549182a3-fbd2-475b-92ba-32124ca2c902")
        integration = await session.get(Integration, int_id)
        if integration:
            print(json.dumps(integration.metadata_info, indent=2, default=str))
        else:
            print("Integration not found.")

if __name__ == "__main__":
    asyncio.run(dump_metadata())
