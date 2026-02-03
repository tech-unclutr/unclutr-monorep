import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select, or_
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.campaign import Campaign

# Database URL from environment or default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://param@localhost:5432/postgres")

async def check_duplicates():
    engine = create_async_engine(DATABASE_URL)
    async with AsyncSession(engine) as session:
        # Get the campaign
        campaign_id = "7b277bac-9157-4c01-9b6e-3b28b088e0b4"
        
        # Check BolnaExecutionMap entries for this campaign
        stmt = (
            select(BolnaExecutionMap, QueueItem, CampaignLead)
            .join(QueueItem, BolnaExecutionMap.queue_item_id == QueueItem.id)
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .where(BolnaExecutionMap.campaign_id == campaign_id)
        )
        
        result = await session.execute(stmt)
        rows = result.all()
        
        print(f"\nTotal BolnaExecutionMap entries: {len(rows)}\n")
        
        # Group by lead to see duplicates
        lead_map = {}
        for exec_map, q_item, lead in rows:
            lead_name = lead.customer_name
            if lead_name not in lead_map:
                lead_map[lead_name] = []
            lead_map[lead_name].append({
                "exec_map_id": str(exec_map.id),
                "queue_item_id": str(q_item.id),
                "call_status": exec_map.call_status,
                "created_at": exec_map.created_at,
                "updated_at": exec_map.updated_at
            })
        
        for lead_name, entries in lead_map.items():
            print(f"\n{lead_name}: {len(entries)} execution map entries")
            for entry in sorted(entries, key=lambda x: x["created_at"]):
                print(f"  - ExecMap: {entry['exec_map_id'][:8]}... | QueueItem: {entry['queue_item_id'][:8]}... | Status: {entry['call_status']} | Created: {entry['created_at']}")

if __name__ == "__main__":
    asyncio.run(check_duplicates())
