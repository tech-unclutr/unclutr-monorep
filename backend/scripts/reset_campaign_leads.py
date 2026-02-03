
import asyncio
import sys
import os
from uuid import UUID
from sqlmodel import delete, select
from app.core.db import get_session
from app.models.queue_item import QueueItem
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.campaign_lead import CampaignLead
from app.models.campaign import Campaign

async def reset_campaign_leads(campaign_id_str: str):
    campaign_id = UUID(campaign_id_str)
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    print(f"🔄 Resetting leads for campaign: {campaign_id}")

    try:
        # 1. Delete BolnaExecutionMap
        exec_stmt = delete(BolnaExecutionMap).where(BolnaExecutionMap.campaign_id == campaign_id)
        await session.exec(exec_stmt)
        print("✅ Deleted BolnaExecutionMap entries.")

        # 2. Delete QueueItem
        queue_stmt = delete(QueueItem).where(QueueItem.campaign_id == campaign_id)
        await session.exec(queue_stmt)
        print("✅ Deleted QueueItem entries.")

        # 3. Reset CampaignLead status
        lead_stmt = select(CampaignLead).where(CampaignLead.campaign_id == campaign_id)
        leads = (await session.exec(lead_stmt)).all()
        for lead in leads:
            lead.status = "PENDING"
            session.add(lead)
        print(f"✅ Reset {len(leads)} CampaignLead statuses to PENDING.")

        # 4. Optional: Reset Campaign status if needed
        campaign = await session.get(Campaign, campaign_id)
        if campaign:
            campaign.status = "DRAFT"
            session.add(campaign)
            print(f"✅ Reset Campaign status to DRAFT.")

        await session.commit()
        print("🚀 Reset complete!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        await session.rollback()
    finally:
        await session.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python reset_campaign_leads.py <campaign_id>")
        sys.exit(1)
    
    asyncio.run(reset_campaign_leads(sys.argv[1]))
