import asyncio
import sys
import os
from uuid import UUID
from sqlmodel import delete, select, col
from sqlalchemy.orm import selectinload

# Add the backend directory to sys.path to allow importing app components
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.db import get_session
from app.models.queue_item import QueueItem
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.call_log import CallLog
from app.models.campaign_event import CampaignEvent
from app.models.campaign_lead import CampaignLead
from app.models.campaign import Campaign

async def clear_campaign_activity(campaign_id_str: str):
    try:
        campaign_id = UUID(campaign_id_str)
    except ValueError:
        print(f"❌ Invalid campaign ID format: {campaign_id_str}")
        return

    print(f"🔄 Starting activity cleanup for campaign: {campaign_id}")

    session_gen = get_session()
    session = await session_gen.__anext__()

    try:
        # 1. Delete BolnaExecutionMap
        exec_stmt = delete(BolnaExecutionMap).where(BolnaExecutionMap.campaign_id == campaign_id)
        result = await session.exec(exec_stmt)
        print(f"✅ Deleted {result.rowcount} BolnaExecutionMap entries.")

        # 2. Delete QueueItem
        queue_stmt = delete(QueueItem).where(QueueItem.campaign_id == campaign_id)
        result = await session.exec(queue_stmt)
        print(f"✅ Deleted {result.rowcount} QueueItem entries.")

        # 3. Delete CallLog
        # CallLog has a direct campaign_id link
        call_stmt = delete(CallLog).where(CallLog.campaign_id == campaign_id)
        result = await session.exec(call_stmt)
        print(f"✅ Deleted {result.rowcount} CallLog entries.")

        # 4. Delete CampaignEvent
        event_stmt = delete(CampaignEvent).where(CampaignEvent.campaign_id == campaign_id)
        result = await session.exec(event_stmt)
        print(f"✅ Deleted {result.rowcount} CampaignEvent entries.")

        # 5. Reset CampaignLead status to PENDING
        lead_stmt = select(CampaignLead).where(CampaignLead.campaign_id == campaign_id)
        leads = (await session.exec(lead_stmt)).all()
        
        reset_count = 0
        for lead in leads:
            if lead.status != "PENDING":
                lead.status = "PENDING"
                session.add(lead)
                reset_count += 1
        
        print(f"✅ Reset {reset_count} leads to PENDING (Total leads: {len(leads)}).")

        # 6. Reset Campaign Status to READY (so it can be started again)
        campaign = await session.get(Campaign, campaign_id)
        if campaign:
            print(f"ℹ️ Current campaign status: {campaign.status}")
            campaign.status = "READY" 
            session.add(campaign)
            print(f"✅ Reset Campaign status to READY.")
        else:
            print("⚠️ Campaign not found!")

        await session.commit()
        print("🚀 Cleanup complete! The campaign is fresh.")

    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        await session.rollback()
    finally:
        await session.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python clear_campaign_activity.py <campaign_id>")
        sys.exit(1)
    
    asyncio.run(clear_campaign_activity(sys.argv[1]))
