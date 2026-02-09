import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from sqlmodel import select, func
from app.core.db import async_session_factory
from app.models.call_log import CallLog
from app.models.user_queue_item import UserQueueItem
from app.models.campaign_lead import CampaignLead

async def check_call_logs():
    async with async_session_factory() as session:
        # Check CallLog outcomes
        print("\n=== CallLog Outcome Distribution ===")
        result = await session.execute(
            select(CallLog.outcome, func.count(CallLog.id))
            .group_by(CallLog.outcome)
            .order_by(func.count(CallLog.id).desc())
        )
        for outcome, count in result.all():
            print(f"{outcome}: {count}")
        
        # Check if there are any "Disconnected" in CallLog
        print("\n=== Checking for 'Disconnected' CallLogs ===")
        result = await session.execute(
            select(CallLog)
            .where(CallLog.outcome.like('%Disconnect%'))
            .limit(5)
        )
        disconnected_logs = result.scalars().all()
        if disconnected_logs:
            for log in disconnected_logs:
                print(f"Lead: {log.lead_id}, Outcome: {log.outcome}, Status: {log.status}")
        else:
            print("(none found)")
        
        # Check UserQueueItem details
        print("\n=== UserQueueItem Details ===")
        result = await session.execute(select(UserQueueItem))
        user_queue_items = result.scalars().all()
        for item in user_queue_items:
            # Get lead name
            lead_result = await session.execute(
                select(CampaignLead).where(CampaignLead.id == item.lead_id)
            )
            lead = lead_result.scalar_one_or_none()
            lead_name = lead.name if lead else "Unknown"
            
            print(f"ID: {item.id}")
            print(f"  Lead: {lead_name} ({item.lead_id})")
            print(f"  Status: {item.status}")
            print(f"  Priority: {item.priority_score}")
            print(f"  Intent: {item.intent_strength}")
            print(f"  Summary: {item.ai_summary[:100] if item.ai_summary else 'N/A'}...")

if __name__ == "__main__":
    asyncio.run(check_call_logs())
