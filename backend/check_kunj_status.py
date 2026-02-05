import asyncio
from uuid import UUID
from app.core.db import async_session_factory
from app.models.campaign_lead import CampaignLead
from app.models.queue_item import QueueItem
from sqlmodel import select

async def check_kunj():
    async with async_session_factory() as session:
        # Search for lead named Kunj
        stmt = select(CampaignLead).where(CampaignLead.customer_name.like("%Kunj%"))
        result = await session.execute(stmt)
        leads = result.scalars().all()
        
        for lead in leads:
            print(f"Lead: {lead.customer_name}, ID: {lead.id}, Phone: {lead.contact_number}")
            q_stmt = select(QueueItem).where(QueueItem.lead_id == lead.id)
            q_result = await session.execute(q_stmt)
            q_items = q_result.scalars().all()
            for item in q_items:
                print(f"  QueueItem: {item.id}, Status: {item.status}, Execution Count: {item.execution_count}, Campaign ID: {item.campaign_id}")
                
                # Fetch maps
                from app.models.bolna_execution_map import BolnaExecutionMap
                stmt_map = select(BolnaExecutionMap).where(BolnaExecutionMap.queue_item_id == item.id)
                result_map = await session.execute(stmt_map)
                maps = result_map.scalars().all()
                for m in maps:
                    print(f"    Map ID: {m.id}, Call Status: {m.call_status}, Duration: {m.call_duration}, Created: {m.created_at}, Updated: {m.updated_at}")
                    
                    from datetime import datetime, timedelta
                    now_utc = datetime.utcnow()
                    cutoff = now_utc - timedelta(minutes=2)
                    print(f"    DEBUG: Now={now_utc}, Cutoff={cutoff}, IsRecent={m.updated_at > cutoff}")

if __name__ == "__main__":
    asyncio.run(check_kunj())
