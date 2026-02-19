import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from sqlmodel import select, or_
from app.core.db import async_session_factory
from app.models.queue_item import QueueItem
from app.models.campaign_lead import CampaignLead

async def main():
    async with async_session_factory() as session:
        print("[*] Listing Active Campaigns:")
        from app.models.campaign import Campaign
        from app.models.call_log import CallLog
        from app.models.campaign_event import CampaignEvent
        
        c_stmt = select(Campaign)
        c_res = await session.execute(c_stmt)
        campaigns = c_res.scalars().all()
        for c in campaigns:
            print(f"ID: {c.id} | Name: {c.name} | Status: {c.status}")
            
            # Count activity
            cl_cnt = await session.execute(select(func.count(CallLog.id)).where(CallLog.campaign_id == c.id))
            ce_cnt = await session.execute(select(func.count(CampaignEvent.id)).where(CampaignEvent.campaign_id == c.id))
            qi_cnt = await session.execute(select(func.count(QueueItem.id)).where(QueueItem.campaign_id == c.id))
            
            print(f"  -> CallLogs: {cl_cnt.scalars().first()} | CampaignEvents: {ce_cnt.scalars().first()} | QueueItems: {qi_cnt.scalars().first()}")

        print("\n[*] Latest 5 UserQueueItems (Active):")
        from app.models.user_queue_item import UserQueueItem
        uq_stmt = select(UserQueueItem, CampaignLead).join(CampaignLead, UserQueueItem.lead_id == CampaignLead.id).where(UserQueueItem.status != "CLOSED").order_by(UserQueueItem.updated_at.desc()).limit(5)
        uq_res = await session.execute(uq_stmt)
        for uqi, lead in uq_res.all():
            print(f"Lead: {lead.customer_name} | Status: {uqi.status} | Last AI Call: {uqi.call_history.get('created_at') if uqi.call_history else 'None'} | Updated: {uqi.updated_at}")
            # Check if there's a newer BolnaExecutionMap
            from app.models.bolna_execution_map import BolnaExecutionMap
            b_stmt = select(BolnaExecutionMap).where(BolnaExecutionMap.queue_item_id == uqi.original_queue_item_id).order_by(BolnaExecutionMap.created_at.desc()).limit(1)
            b_res = await session.execute(b_stmt)
            b_map = b_res.scalar_one_or_none()
            if b_map:
                print(f"  -> Latest BolnaMap: {b_map.created_at} | Status: {b_map.call_status}")

        print("\n[*] Latest 5 Campaign Events:")
        stmt_ev = select(CampaignEvent).order_by(CampaignEvent.created_at.desc()).limit(5)
        res_ev = await session.execute(stmt_ev)
        for ev in res_ev.scalars().all():
            print(f"Time: {ev.created_at} | Type: {ev.event_type} | Msg: {ev.message}")

if __name__ == "__main__":
    asyncio.run(main())
