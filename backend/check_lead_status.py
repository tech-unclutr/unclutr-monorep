
import asyncio
from sqlmodel import select
from app.core.db import async_session_factory
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem
from app.models.campaign import Campaign

async def main():
    async with async_session_factory() as session:
        # 1. Find the lead "Param"
        stmt = select(CampaignLead).where(CampaignLead.customer_name.ilike("%Param%"))
        result = await session.execute(stmt)
        leads = result.scalars().all()

        if not leads:
            print("No lead found with name 'Param'")
            return

        print(f"Found {len(leads)} lead(s) for 'Param':")
        for lead in leads:
            print(f"--- Lead: {lead.customer_name} (ID: {lead.id}) ---")
            print(f"  Cohort: {lead.cohort}")
            print(f"  Campaign ID: {lead.campaign_id}")
            
            # Check Campaign Status
            campaign = await session.get(Campaign, lead.campaign_id)
            if campaign:
                print(f"  Campaign Name: {campaign.name}")
                print(f"  Campaign Selected Cohorts: {campaign.selected_cohorts}")
            
            # Check QueueItem
            q_stmt = select(QueueItem).where(QueueItem.lead_id == lead.id)
            q_result = await session.execute(q_stmt)
            q_item = q_result.scalar_one_or_none()
            
            if q_item:
                print(f"  QueueItem Status: {q_item.status}")
                print(f"  QueueItem Priority: {q_item.priority_score}")
                print(f"  QueueItem Created At: {q_item.created_at}")
            else:
                print("  No QueueItem found (Likely in Backlog if not processed)")

if __name__ == "__main__":
    asyncio.run(main())
