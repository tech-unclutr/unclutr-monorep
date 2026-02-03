import asyncio
import sys
import os
from uuid import UUID

# Add current directory to path
sys.path.append(os.getcwd())

from app.core.db import get_session
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem
from app.models.bolna_execution_map import BolnaExecutionMap
from sqlmodel import select

async def debug_leads():
    async for session in get_session():
        # 1. Get campaign
        stmt = select(Campaign).order_by(Campaign.updated_at.desc()).limit(1)
        result = await session.execute(stmt)
        campaign = result.scalars().first()
        if not campaign: return
        print(f"Using campaign: {campaign.name} (ID: {campaign.id})\n")

        # 2. Check for "Param" and "Kunj"
        stmt = select(CampaignLead).where(CampaignLead.campaign_id == campaign.id)
        result = await session.execute(stmt)
        leads = result.scalars().all()
        
        for lead in leads:
            if "Param" in lead.customer_name or "Kunj" in lead.customer_name:
                # Queue Item
                q_stmt = select(QueueItem).where(QueueItem.lead_id == lead.id, QueueItem.campaign_id == campaign.id)
                q_result = await session.execute(q_stmt)
                q_item = q_result.scalars().first()
                
                # Execution Map
                exec_stmt = select(BolnaExecutionMap).join(QueueItem).where(QueueItem.lead_id == lead.id)
                exec_result = await session.execute(exec_stmt)
                exec_map = exec_result.scalars().first()
                
                print(f"Lead: {lead.customer_name} (ID: {lead.id})")
                print(f"  CampaignLead Status: {lead.status}")
                print(f"  QueueItem Status: {q_item.status if q_item else 'NONE'}")
                if exec_map:
                    print(f"  Bolna Call Status: {exec_map.call_status}")
                    print(f"  Bolna Agent ID: {exec_map.bolna_agent_id}")
                else:
                    print(f"  Bolna Call Status: NO EXEC MAP")
                print("-" * 20)

if __name__ == "__main__":
    asyncio.run(debug_leads())
