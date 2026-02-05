import asyncio
from uuid import UUID
from app.core.db import async_session_factory
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem
from app.models.bolna_execution_map import BolnaExecutionMap
from sqlmodel import select

async def fix_kunj():
    print("Fixing Kunj state...")
    async with async_session_factory() as session:
        # Search for lead named Kunj
        stmt = select(CampaignLead).where(CampaignLead.customer_name.like("%Kunj%"))
        result = await session.execute(stmt)
        leads = result.scalars().all()
        
        for lead in leads:
            print(f"Lead: {lead.customer_name}, ID: {lead.id}")
            q_stmt = select(QueueItem).where(QueueItem.lead_id == lead.id)
            q_result = await session.execute(q_stmt)
            q_items = q_result.scalars().all()
            
            for item in q_items:
                print(f"  Processing QueueItem: {item.id}, Status: {item.status}")
                
                # Fetch maps
                stmt_map = select(BolnaExecutionMap).where(BolnaExecutionMap.queue_item_id == item.id)
                result_map = await session.execute(stmt_map)
                maps = result_map.scalars().all()
                for m in maps:
                    if m.call_status == "initiated":
                        print(f"    FIXING Map ID: {m.id}, Current Status: {m.call_status}")
                        m.call_status = "canceled"
                        session.add(m)
        
        await session.commit()
        print("Done.")

if __name__ == "__main__":
    asyncio.run(fix_kunj())
