
import asyncio
import os
from uuid import UUID
from sqlmodel import select
from app.api.deps import get_session
from app.core.db import async_session_factory
from app.models.campaign import Campaign
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from app.models.bolna_execution_map import BolnaExecutionMap

async def main():
    target_campaign_id = UUID('ad93fc09-1a73-4273-929a-73c2b6572a8c')

    async with async_session_factory() as session:
        # Fetch Campaign
        campaign = await session.get(Campaign, target_campaign_id)
        if not campaign:
            print(f"Campaign {target_campaign_id} not found!")
            return
            
        print(f"Campaign: {campaign.name} ({campaign.id})")
        print(f"Status: {campaign.status}")
        print(f"Windows: {campaign.execution_windows}")

        print(f"\n--- Checking Leads for Campaign {campaign.id} ---")
        # specific lead "Param"
        stmt = (
            select(QueueItem, CampaignLead)
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .where(QueueItem.campaign_id == campaign.id)
            .where(CampaignLead.customer_name.ilike("%param%"))
        )
        result = await session.execute(stmt)
        items = result.all()
        
        if not items:
            print("No lead found with name 'Param'")
            # Dump all queue items for context
            print("--- All Queue Items ---")
            q_stmt = select(QueueItem).where(QueueItem.campaign_id == campaign.id)
            all_items = (await session.execute(q_stmt)).scalars().all()
            for item in all_items:
                print(f"Item ID: {item.id}, Status: {item.status}, Lead ID: {item.lead_id}")

        for q_item, lead in items:
            print(f"Lead: {lead.customer_name} ({lead.id})")
            print(f"  QueueItem ID: {q_item.id}")
            print(f"  Status: {q_item.status}")
            print(f"  Scheduled For: {q_item.scheduled_for}")
            print(f"  Updated At: {q_item.updated_at}")
            print(f"  Priority: {q_item.priority_score}")
            
            # Check for Execution Maps
            m_stmt = select(BolnaExecutionMap).where(BolnaExecutionMap.queue_item_id == q_item.id)
            maps = (await session.execute(m_stmt)).scalars().all()
            print(f"  Execution Maps ({len(maps)}):")
            for m in maps:
                print(f"    - ID: {m.id} | Status: {m.call_status} | Outcome: {m.call_outcome} | Updated: {m.updated_at}")

if __name__ == "__main__":
    asyncio.run(main())
