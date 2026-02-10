
import asyncio
from app.core.db import async_session_factory
from sqlmodel import select
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.models.user_queue_item import UserQueueItem
from app.models.queue_item import QueueItem

async def main():
    async with async_session_factory() as session:
        # 1. List Campaigns
        print("\n--- Campaigns ---")
        result = await session.exec(select(Campaign))
        campaigns = result.all()
        for c in campaigns:
            print(f"ID: {c.id}, Name: {c.name or 'No Name'}")

        if not campaigns:
            print("No campaigns found.")
            return

        # 2. Check Leads and Queue for the first campaign (or all)
        for c in campaigns:
            print(f"\n--- Campaign: {c.name} ({c.id}) ---")
            
            # Count Leads
            result = await session.exec(select(CampaignLead).where(CampaignLead.campaign_id == c.id))
            leads = result.all()
            total_leads = len(leads)
            
            # Count Leads by Status
            status_counts = {}
            for l in leads:
                status_counts[l.status] = status_counts.get(l.status, 0) + 1
            print(f"Total Leads: {total_leads}")
            print(f"Lead Statuses: {status_counts}")
            
            # Count Queue Items
            result = await session.exec(select(UserQueueItem).where(UserQueueItem.campaign_id == c.id))
            queue_items = result.all()
            total_queue = len(queue_items)
            
            print(f"Total Queue Items: {total_queue}")
            
            # Queue Status Check
            q_status_counts = {}
            for q in queue_items:
                q_status_counts[q.status] = q_status_counts.get(q.status, 0) + 1
            print(f"Queue Statuses: {q_status_counts}")
            
            # Count AI Queue Items (QueueItem)
            result = await session.exec(select(QueueItem).where(QueueItem.campaign_id == c.id))
            ai_queue_items = result.all()
            print(f"Total AI Queue Items: {len(ai_queue_items)}")
            
            ai_status_counts = {}
            for q in ai_queue_items:
                ai_status_counts[q.status] = ai_status_counts.get(q.status, 0) + 1
                if q.status == 'CLOSED':
                    print(f"  - Closed Item: ID={q.id}, Outcome={q.outcome}, Reason={q.closure_reason}, Promoted={q.promoted_to_user_queue}")
            print(f"AI Queue Statuses: {ai_status_counts}")

            # Check for Leads that are supposedly 'OPEN' or 'INTERESTED' but not in Queue
            lead_ids_in_queue = {q.lead_id for q in queue_items}
            leads_not_in_queue = [l for l in leads if l.id not in lead_ids_in_queue]
            
            print(f"Leads NOT in Queue: {len(leads_not_in_queue)}")
            if leads_not_in_queue:
                print("Sample of leads not in queue:")
                for l in leads_not_in_queue[:10]:
                    print(f" - ID: {l.id}, Status: {l.status}, Name: {l.customer_name}")

if __name__ == "__main__":
    asyncio.run(main())
