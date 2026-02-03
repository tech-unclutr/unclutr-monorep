import asyncio
from uuid import UUID
from sqlmodel import select, func, or_
from app.api.deps import get_session
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem
from app.models.bolna_execution_map import BolnaExecutionMap
from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

CAMPAIGN_ID = UUID("7b277bac-9157-4c01-9b6e-3b28b088e0b4")

async def debug_active_state():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        print(f"\n=== Active State Debug for {CAMPAIGN_ID} ===")
        
        # 0. Check Status
        campaign = await session.get(Campaign, CAMPAIGN_ID)
        print(f"Campaign Status: {campaign.status}")
        
        # 1. Check DIALING_INTENT items
        stmt = select(QueueItem).where(QueueItem.campaign_id == CAMPAIGN_ID).where(QueueItem.status == 'DIALING_INTENT')
        results = await session.execute(stmt)
        dialing_items = results.scalars().all()
        print(f"Items in DIALING_INTENT: {len(dialing_items)}")
        for item in dialing_items:
            print(f"- Lead {item.lead_id} (Created: {item.created_at})")

        # 2. Check Active Bolna Executions
        stmt = select(BolnaExecutionMap).where(BolnaExecutionMap.campaign_id == CAMPAIGN_ID)
        results = await session.execute(stmt)
        executions = results.scalars().all()
        print(f"Total Bolna Executions: {len(executions)}")
        
        active_statuses = ["initiated", "ringing", "connected", "speaking"]
        active_execs = [e for e in executions if e.call_status in active_statuses]
        print(f"Active Executions ({active_statuses}): {len(active_execs)}")
        for e in active_execs:
            print(f"- Agent {e.bolna_agent_id}: {e.call_status} (QueueItem: {e.queue_item_id})")
            qi = await session.get(QueueItem, e.queue_item_id)
            if qi:
                print(f"  QueueItem Status: {qi.status}")
                lead = await session.get(CampaignLead, qi.lead_id)
                if lead:
                    print(f"  Lead Found: {lead.customer_name} ({lead.id})")
                else:
                    print(f"  Lead NOT FOUND (ID: {qi.lead_id})")
            else:
                 print("  QueueItem NOT FOUND")

        # 3. Check Recent Failed/Completed
        recent_ended = [e for e in executions if e.call_status not in active_statuses]
        print(f"Recently Ended Executions: {len(recent_ended)}")
        for e in recent_ended[-5:]:
            print(f"- {e.call_status} at {e.updated_at}")

        # 4. Check Queue Warmer loop trigger
        # Simulate active count query
        stmt = (
            select(func.count(QueueItem.id))
            .where(QueueItem.campaign_id == CAMPAIGN_ID)
            .where(
                or_(
                    QueueItem.status == "DIALING_INTENT",
                    # Note: The original query joins BolnaExecutionMap, here we simplify
                )
            )
        )
        # This is just a rough check of DIALING_INTENT count
        
if __name__ == "__main__":
    asyncio.run(debug_active_state())
