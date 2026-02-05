import asyncio
from uuid import UUID
from sqlmodel import select, or_
from app.core.db import AsyncSession
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem

async def debug_query(campaign_id_str):
    campaign_id = UUID(campaign_id_str)
    from sqlalchemy.ext.asyncio import create_async_engine
    from app.core.config import settings
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with AsyncSession(engine) as session:
        # 1. Check existing_q
        existing_q_stmt = select(QueueItem.lead_id).where(QueueItem.campaign_id == campaign_id)
        existing_q_res = await session.execute(existing_q_stmt)
        existing_ids = existing_q_res.scalars().all()
        print(f"DEBUG: Existing QueueItem lead_ids for campaign {campaign_id}: {existing_ids}")
        
        # 2. Check all leads for campaign
        all_leads_stmt = select(CampaignLead).where(CampaignLead.campaign_id == campaign_id)
        all_leads = (await session.execute(all_leads_stmt)).scalars().all()
        print(f"DEBUG: All leads for campaign: {[l.id for l in all_leads]}")
        
        # 3. Try the specific query
        query = select(CampaignLead).where(CampaignLead.campaign_id == campaign_id)
        # Using the same logic as queue_warmer.py
        existing_q = select(QueueItem.lead_id).where(QueueItem.campaign_id == campaign_id)
        query = query.where(CampaignLead.id.not_in(existing_q))
        
        print(f"DEBUG: Running query: {query}")
        candidates = (await session.execute(query)).scalars().all()
        print(f"DEBUG: Candidates found: {[c.id for c in candidates]}")

if __name__ == "__main__":
    campaign_id = "ff4d88d2-9c17-4da6-90a5-c8eceb976566"
    asyncio.run(debug_query(campaign_id))
