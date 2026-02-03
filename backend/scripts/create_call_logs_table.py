import asyncio
from sqlmodel import SQLModel
from app.core.db import engine
# Import ALL models to ensure they are registered with SQLModel.metadata
from app.models.user import User
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.call_log import CallLog

async def create_tables():
    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    print("Tables created successfully.")

if __name__ == "__main__":
    asyncio.run(create_tables())
