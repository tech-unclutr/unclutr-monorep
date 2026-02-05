import asyncio
import sys
import os
from uuid import UUID
from datetime import datetime

sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.models.campaign import Campaign
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from sqlmodel import select

async def inspect_queue(campaign_id_str):
    async with async_session_factory() as session:
        campaign_id = UUID(campaign_id_str)
        
        print(f"--- Inspecting Queue for Campaign {campaign_id} ---")
        
        # 1. Fetch all Queue Items
        stmt = (
            select(QueueItem, CampaignLead)
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .where(QueueItem.campaign_id == campaign_id)
            .order_by(QueueItem.created_at)
        )
        result = await session.execute(stmt)
        rows = result.all()
        
        print(f"Found {len(rows)} Queue Items:")
        print(f"{'Status':<15} | {'Lead Name':<15} | {'Lead Phone':<15} | {'Updated At':<25} | {'Exec Count'}")
        print("-" * 90)
        
        for item, lead in rows:
            print(f"{item.status:<15} | {lead.customer_name:<15} | {lead.contact_number:<15} | {str(item.updated_at):<25} | {item.execution_count}")
            
        # 2. Check for Duplicates
        print("\n--- Duplicate Check ---")
        lead_counts = {}
        for item, lead in rows:
            lead_counts[lead.id] = lead_counts.get(lead.id, 0) + 1
            
        duplicates = {k: v for k, v in lead_counts.items() if v > 1}
        if duplicates:
            print(f"WARNING: Found {len(duplicates)} leads with multiple queue items!")
            for lead_id, count in duplicates.items():
                # Find name
                name = next((l.customer_name for i, l in rows if l.id == lead_id), "Unknown")
                print(f"Lead {name} ({lead_id}) has {count} queue items.")
        else:
            print("No duplicates found (1 queue item per lead).")

        # 3. Check Total Leads in Campaign
        res = await session.execute(select(CampaignLead).where(CampaignLead.campaign_id == campaign_id))
        all_leads = res.scalars().all()
        print(f"\nTotal Leads in Campaign Table: {len(all_leads)}")
        for l in all_leads:
             print(f"- {l.customer_name} ({l.contact_number}) [Cohort: {l.cohort}]")

if __name__ == "__main__":
    asyncio.run(inspect_queue("ff4d88d2-9c17-4da6-90a5-c8eceb976566"))
