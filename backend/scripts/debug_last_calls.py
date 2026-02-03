import asyncio
import os
import sys
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import select, desc
from app.core.db import async_session_factory
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.campaign_lead import CampaignLead
from app.models.call_log import CallLog

async def main():
    async with async_session_factory() as session:
        print("[*] --- Latest 10 Bolna Execution Maps ---")
        stmt = (
            select(BolnaExecutionMap, CampaignLead)
            .join(CampaignLead, BolnaExecutionMap.queue_item_id == CampaignLead.id, isouter=True) # Loose join via queue_item? No, queue_item_id is queue_item.id
            # We need to join QueueItem first
        )
        
        # Let's just query CallLogs if they exist, or BolnaExecutionMaps
        try:
           stmt = (
               select(CallLog, CampaignLead)
               .join(CampaignLead, CallLog.lead_id == CampaignLead.id)
               .order_by(desc(CallLog.created_at))
               .limit(10)
           )
           res = await session.execute(stmt)
           logs = res.all()
           
           if logs:
               for log, lead in logs:
                   print(f"Time: {log.created_at} | Status: {log.status} | Lead: {lead.customer_name} ({lead.contact_number}) | ID: {log.bolna_call_id}")
           else:
               print("No CallLogs found.")
               
        except Exception as e:
            print(f"Error querying CallLogs: {e}")
            
        print("\n[*] --- Latest 10 Bolna Execution Maps (Backup) ---")
        # Try finding directly from map
        stmt2 = select(BolnaExecutionMap).order_by(desc(BolnaExecutionMap.created_at)).limit(10)
        res2 = await session.execute(stmt2)
        maps = res2.scalars().all()
        for m in maps:
             print(f"Time: {m.created_at} | Status: {m.call_status} | Agent: {m.bolna_agent_id} | Call ID: {m.bolna_call_id}")

if __name__ == "__main__":
    asyncio.run(main())
