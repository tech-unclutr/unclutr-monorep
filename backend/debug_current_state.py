
import asyncio
import os
from sqlmodel import select
from app.api.deps import get_session
from app.core.db import async_session_factory
from app.models.campaign import Campaign
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from app.models.bolna_execution_map import BolnaExecutionMap

async def main():
    async with async_session_factory() as session:
        # Find campaign
        print("--- Finding Active Campaign ---")
        stmt = select(Campaign).where(Campaign.status == "ACTIVE")
        result = await session.execute(stmt)
        campaign = result.scalars().first()
        
        if not campaign:
            print("No ACTIVE campaign found. Checking all campaigns...")
            stmt = select(Campaign)
            result = await session.execute(stmt)
            campaigns = result.scalars().all()
            for c in campaigns:
                print(f"Campaign: {c.name} ({c.id}) - Status: {c.status}")
                
            # Pick the most recent one for context if none active
            if campaigns:
                campaign = campaigns[0] # Just pick one
            else:
                return
        else:
            print(f"Active Campaign: {campaign.name} ({campaign.id})")

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
        
        for q_item, lead in items:
            print(f"Lead: {lead.customer_name} ({lead.id})")
            print(f"  QueueItem ID: {q_item.id}")
            print(f"  Status: {q_item.status}")
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
