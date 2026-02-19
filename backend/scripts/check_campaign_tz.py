
import asyncio
from uuid import UUID
from app.core.db import async_session_factory
from app.models.campaign import Campaign
from app.models.company import Company
from sqlmodel import select

async def check_timezone(campaign_id_str: str):
    campaign_id = UUID(campaign_id_str)
    async with async_session_factory() as session:
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            print(f"Campaign {campaign_id_str} not found")
            return
        
        company = await session.get(Company, campaign.company_id)
        if not company:
            print(f"Company {campaign.company_id} not found")
            return
        
        print(f"Campaign ID: {campaign_id}")
        print(f"Company ID: {company.id}")
        print(f"Company Timezone: {company.timezone}")
        print(f"Campaign Status: {campaign.status}")
        print(f"Campaign Windows: {campaign.execution_windows}")

if __name__ == "__main__":
    campaign_id = "8a717b0b-f7ed-4f9a-b384-eb10b1664145"
    asyncio.run(check_timezone(campaign_id))
