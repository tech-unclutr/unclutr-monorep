import asyncio
import sys
import os
sys.path.append(os.getcwd())
from app.core.db import get_session
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from sqlmodel import select, func

async def audit():
    async for session in get_session():
        print("--- QueueItem Status Counts ---")
        stmt = select(QueueItem.status, func.count(QueueItem.id)).group_by(QueueItem.status)
        result = await session.execute(stmt)
        print(dict(result.all()))
        
        print("\n--- CampaignLead Status Counts ---")
        stmt = select(CampaignLead.status, func.count(CampaignLead.id)).group_by(CampaignLead.status)
        result = await session.execute(stmt)
        print(dict(result.all()))

if __name__ == "__main__":
    asyncio.run(audit())
