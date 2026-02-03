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
        print("[*] --- Queue Status for Param & Kunj ---")
        names = ["Param", "Kunj"]
        
        for name in names:
            stmt = select(CampaignLead).where(CampaignLead.customer_name.contains(name))
            leads = (await session.execute(stmt)).scalars().all()
            
            if not leads: 
                print(f"Lead '{name}' not found.")
                continue
                
            for lead in leads:
                q_stmt = select(QueueItem).where(QueueItem.lead_id == lead.id)
                q_items = (await session.execute(q_stmt)).scalars().all()
                
                if not q_items:
                    print(f"Lead {lead.customer_name} has NO QueueItem.")
                
                for q in q_items:
                    print(f"Lead: {lead.customer_name} | QueueItem Status: {q.status} | Attempts: {q.execution_count} | Updated: {q.updated_at}")

        print("\n[*] --- Latest 5 Global Bolna Executions ---")
        stmt = select(BolnaExecutionMap).order_by(desc(BolnaExecutionMap.created_at)).limit(5)
        execs = (await session.execute(stmt)).scalars().all()
        for e in execs:
             print(f"Time: {e.created_at} | Status: {e.call_status} | ID: {e.bolna_call_id}")

if __name__ == "__main__":
    asyncio.run(main())
