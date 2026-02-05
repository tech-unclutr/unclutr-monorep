
import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlmodel import select, desc
from app.core.db import async_session_factory
from app.models.campaign import Campaign
from app.models.queue_item import QueueItem
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.campaign_lead import CampaignLead

async def inspect_state():
    async with async_session_factory() as session:
        # 1. Get latest active campaign
        stmt = select(Campaign).order_by(desc(Campaign.updated_at)).limit(1)
        result = await session.execute(stmt)
        campaign = result.scalars().first()
        
        if not campaign:
            print("No campaigns found.")
            return
            
        print(f"=== CAMPAIGN: {campaign.name} (ID: {campaign.id}) ===")
        print(f"Status: {campaign.status}")
        
        # 2. Check Queue Items (Active/Recent)
        print("\n=== RECENT QUEUE ITEMS ===")
        stmt = select(QueueItem, CampaignLead).join(CampaignLead).where(QueueItem.campaign_id == campaign.id).order_by(desc(QueueItem.updated_at)).limit(5)
        result = await session.execute(stmt)
        for qi, lead in result.all():
            print(f"Lead: {lead.customer_name} | Status: {qi.status} | Updated: {qi.updated_at}")
            
        # 3. Check Bolna Execution Maps
        print("\n=== BOLNA EXECUTION MAPS ===")
        stmt = select(BolnaExecutionMap).where(BolnaExecutionMap.campaign_id == campaign.id).order_by(desc(BolnaExecutionMap.updated_at)).limit(5)
        result = await session.execute(stmt)
        maps = result.scalars().all()
        for em in maps:
            print(f"Call ID: {em.bolna_call_id} | Status: {em.call_status} | Duration: {em.call_duration}")

if __name__ == "__main__":
    asyncio.run(inspect_state())
