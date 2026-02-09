import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from sqlmodel import select
from app.core.db import async_session_factory
from app.models.call_log import CallLog
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.queue_item import QueueItem
from app.core.agreement_utils import detect_agreement_status, should_copy_to_queue

async def investigate_open_leads():
    async with async_session_factory() as session:
        print("\n=== Investigating 'Open' Status Leads ===\n")
        
        # Find all call logs (check various possible "open" representations)
        result = await session.execute(
            select(CallLog).order_by(CallLog.created_at.desc()).limit(20)
        )
        all_logs = result.scalars().all()
        
        print(f"Recent {len(all_logs)} call logs:\n")
        
        for log in all_logs:
            # Get execution map
            exec_result = await session.execute(
                select(BolnaExecutionMap).where(
                    BolnaExecutionMap.bolna_call_id == log.bolna_call_id
                )
            )
            exec_map = exec_result.scalar_one_or_none()
            
            # Get queue item
            queue_result = await session.execute(
                select(QueueItem).where(QueueItem.lead_id == log.lead_id)
                .order_by(QueueItem.created_at.desc())
            )
            q_item = queue_result.scalars().first()
            
            print(f"Lead: {log.lead_id}")
            print(f"  CallLog Outcome: {log.outcome}")
            print(f"  CallLog Status: {log.status}")
            print(f"  Duration: {log.duration}s")
            
            if exec_map:
                print(f"  ExecMap Outcome: {exec_map.call_outcome}")
                extracted = exec_map.extracted_data or {}
                print(f"  Extracted: interested={extracted.get('interested')}, user_intent={extracted.get('user_intent', 'N/A')[:50]}")
                
                # Check agreement
                agreement = detect_agreement_status(
                    user_intent=str(extracted.get('user_intent', '')),
                    outcome=exec_map.call_outcome or log.status,
                    extracted_data=extracted
                )
                print(f"  Agreement: {agreement}")
                should_promote = should_copy_to_queue(agreement)
                print(f"  Should Promote: {should_promote}")
            
            if q_item:
                print(f"  QueueItem Status: {q_item.status}")
                print(f"  Promoted to User Queue: {q_item.promoted_to_user_queue}")
            else:
                print(f"  QueueItem: NOT FOUND")
            
            print(f"  Copied to User Queue: {log.copied_to_user_queue}")
            print()

if __name__ == "__main__":
    asyncio.run(investigate_open_leads())
