import asyncio
from uuid import UUID
from sqlmodel import select, func
from app.core.db import AsyncSession
from app.models.campaign_lead import CampaignLead

async def check_leads_raw(campaign_id_str):
    campaign_id = UUID(campaign_id_str)
    from sqlalchemy.ext.asyncio import create_async_engine
    from app.core.config import settings
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with AsyncSession(engine) as session:
        stmt = select(CampaignLead).where(CampaignLead.campaign_id == campaign_id)
        leads = (await session.execute(stmt)).scalars().all()
        print(f"DEBUG: Found {len(leads)} leads total.")
        for l in leads:
            print(f"DEBUG: Lead ID: {l.id}, Name: {l.customer_name}, Cohort: '{l.cohort}'")

if __name__ == "__main__":
    campaign_id = "ff4d88d2-9c17-4da6-90a5-c8eceb976566"
    asyncio.run(check_leads_raw(campaign_id))
