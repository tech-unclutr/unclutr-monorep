import asyncio
import sys
import os
sys.path.append(os.getcwd())
from app.core.db import get_session
from app.models.campaign_lead import CampaignLead
from sqlmodel import select

async def check():
    async for session in get_session():
        stmt = select(CampaignLead)
        result = await session.execute(stmt)
        for lead in result.scalars().all():
            print(f"Lead: {lead.customer_name}, Campaign ID: {lead.campaign_id}")

if __name__ == "__main__":
    asyncio.run(check())
