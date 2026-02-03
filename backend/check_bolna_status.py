import asyncio
from uuid import UUID
from sqlmodel import select, func
from app.api.deps import get_session
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead
from app.models.campaign import Campaign

async def check_full_status():
    async for session in get_session():
        # Check Campaigns
        campaigns_stmt = select(Campaign)
        campaigns = (await session.execute(campaigns_stmt)).scalars().all()
        print("\n--- Campaigns ---")
        for c in campaigns:
            print(f"ID: {c.id} | Name: {c.name} | Status: {c.status}")

        # Check QueueItems count by status
        count_stmt = select(QueueItem.status, func.count(QueueItem.id)).group_by(QueueItem.status)
        counts = (await session.execute(count_stmt)).all()
        print("\n--- QueueItem Counts ---")
        for status, count in counts:
            print(f"{status}: {count}")

        # Check Recent QueueItems
        q_stmt = (
            select(QueueItem, CampaignLead)
            .join(CampaignLead, QueueItem.lead_id == CampaignLead.id)
            .order_by(QueueItem.updated_at.desc())
            .limit(10)
        )
        q_results = (await session.execute(q_stmt)).all()
        print("\n--- Recent QueueItems ---")
        for q_item, lead in q_results:
            print(f"Lead: {lead.customer_name} | Status: {q_item.status} | Updated: {q_item.updated_at}")

        # Check BolnaExecutionMap
        exec_stmt = select(BolnaExecutionMap).limit(5)
        execs = (await session.execute(exec_stmt)).scalars().all()
        print("\n--- BolnaExecutionMap ---")
        for e in execs:
            print(f"ID: {e.id} | Status: {e.call_status} | CallID: {e.bolna_call_id}")

if __name__ == "__main__":
    asyncio.run(check_full_status())
