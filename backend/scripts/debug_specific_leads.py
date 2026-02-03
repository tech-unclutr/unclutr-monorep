import asyncio
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import select, desc
from app.core.db import async_session_factory
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from app.models.bolna_execution_map import BolnaExecutionMap

async def main():
    async with async_session_factory() as session:
        print("[*] Debugging leads: Param, Kunj")
        names = ["Param", "Kunj"]
        
        for name in names:
            print(f"\n--- Searching for {name} ---")
            stmt = select(CampaignLead).where(CampaignLead.customer_name.contains(name))
            leads = (await session.execute(stmt)).scalars().all()
            
            if not leads:
                print(f"No lead found with name containing '{name}'")
                continue
                
            for lead in leads:
                print(f"Lead Found: {lead.customer_name} (ID: {lead.id}) | Phone: {lead.contact_number}")
                
                # Check Queue Item
                q_stmt = select(QueueItem).where(QueueItem.lead_id == lead.id)
                q_items = (await session.execute(q_stmt)).scalars().all()
                for q in q_items:
                    print(f"  > QueueItem: Status={q.status}, Updated={q.updated_at}, Campaign={q.campaign_id}")
                    
                # Check Execution Map
                # Join via QueueItem normally, but let's just query by lead via joining queue item if possible or just by campaign/time
                # BolnaExecutionMap doesn't have lead_id, only queue_item_id
                
                if q_items:
                    for q in q_items:
                        exec_stmt = select(BolnaExecutionMap).where(BolnaExecutionMap.queue_item_id == q.id).order_by(desc(BolnaExecutionMap.created_at))
                        execs = (await session.execute(exec_stmt)).scalars().all()
                        for e in execs:
                            print(f"    >> Execution: Status={e.call_status}, Outcome={e.call_outcome}, ID={e.bolna_call_id}, Time={e.created_at}")

if __name__ == "__main__":
    asyncio.run(main())
