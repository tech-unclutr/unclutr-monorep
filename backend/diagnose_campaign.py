
import asyncio
import os
import sys
from uuid import UUID
from sqlalchemy.future import select

# Set up paths
sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem
from app.models.call_log import CallLog

async def inspect_campaign(campaign_id_str: str):
    campaign_id = UUID(campaign_id_str)
    async with async_session_factory() as session:
        # Check Campaign
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            print(f"Campaign {campaign_id} not found")
            return
        
        print(f"--- Campaign: {campaign.name} ({campaign.status}) ---")
        print(f"Selected Cohorts: {campaign.selected_cohorts}")
        
        # Check Leads
        stmt = select(CampaignLead).where(CampaignLead.campaign_id == campaign_id)
        result = await session.execute(stmt)
        leads = result.scalars().all()
        print(f"\nTotal Leads: {len(leads)}")
        
        # Check Queue Items
        stmt = select(QueueItem).where(QueueItem.campaign_id == campaign_id)
        result = await session.execute(stmt)
        queue_items = result.scalars().all()
        print(f"Total Queue Items: {len(queue_items)}")
        
        # Breakdown by status
        status_counts = {}
        for q in queue_items:
            status_counts[q.status] = status_counts.get(q.status, 0) + 1
        print(f"Queue Statuses: {status_counts}")
        
        # Check Call Logs
        stmt = select(CallLog).where(CallLog.campaign_id == campaign_id)
        result = await session.execute(stmt)
        logs = result.scalars().all()
        print(f"Total Call Logs: {len(logs)}")

        # Check for leads in backlog (not in queue)
        existing_q_stmt = select(QueueItem.lead_id).where(QueueItem.campaign_id == campaign_id)
        backlog_stmt = select(CampaignLead).where(
            CampaignLead.campaign_id == campaign_id,
            CampaignLead.id.not_in(existing_q_stmt)
        )
        result = await session.execute(backlog_stmt)
        backlog_leads = result.scalars().all()
        print(f"Leads in Backlog: {len(backlog_leads)}")
        
        if backlog_leads:
            print("Sample Backlog Leads:")
            for l in backlog_leads[:3]:
                print(f" - {l.customer_name} ({l.cohort})")
            
        if queue_items:
            print("\nSample Queue Items:")
            for q in queue_items[:5]:
                print(f" - ID: {q.id} | Status: {q.status} | Count: {q.execution_count} | Outcome: {q.outcome} | Lead ID: {q.lead_id}")

if __name__ == "__main__":
    campaign_id = "ff4d88d2-9c17-4da6-90a5-c8eceb976566"
    asyncio.run(inspect_campaign(campaign_id))
