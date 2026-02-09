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
from app.services.user_queue_warmer import UserQueueWarmer

async def heal_with_transcript_analysis():
    async with async_session_factory() as session:
        print("\n=== Healing Call Data with Transcript Analysis ===\n")
        
        # Find all recent call logs with transcripts
        result = await session.execute(
            select(CallLog, BolnaExecutionMap).join(
                BolnaExecutionMap, CallLog.bolna_call_id == BolnaExecutionMap.bolna_call_id
            ).where(
                BolnaExecutionMap.transcript.isnot(None)
            ).order_by(CallLog.created_at.desc()).limit(50)
        )
        
        candidates = result.all()
        
        print(f"Found {len(candidates)} calls with transcripts to analyze.\n")
        
        healed_count = 0
        promoted_count = 0
        
        for call_log, exec_map in candidates:
            # Extract transcript
            transcript_data = exec_map.transcript or ""
            transcript_str = ""
            
            if isinstance(transcript_data, list):
                transcript_str = "\n".join([
                    f"{turn.get('role', 'unknown')}: {turn.get('content', '')}"
                    for turn in transcript_data
                ])
            elif isinstance(transcript_data, str):
                transcript_str = transcript_data
            
            # Re-analyze with transcript
            agreement_status = detect_agreement_status(
                user_intent=str((exec_map.extracted_data or {}).get("user_intent", "")),
                outcome=call_log.status,
                extracted_data=exec_map.extracted_data,
                transcript_text=transcript_str
            )
            
            is_strong_agreement = (
                agreement_status.get("agreed") is True and 
                agreement_status.get("status") == "yes" and 
                agreement_status.get("confidence") in ["high", "medium"]
            )
            
            # Check if status needs updating
            current_is_positive = call_log.status in ["INTENT_YES", "INTERESTED"]
            
            if is_strong_agreement and not current_is_positive:
                print(f"⚡️ HEALING Lead {call_log.lead_id}")
                print(f"   Old Status: {call_log.outcome}")
                print(f"   Agreement: {agreement_status}")
                print(f"   New Status: Interested\n")
                
                # Update call log
                call_log.outcome = "Interested"
                call_log.status = "INTENT_YES"
                session.add(call_log)
                
                # Update execution map
                exec_map.call_outcome = "INTENT_YES"
                session.add(exec_map)
                
                # Update queue item if exists
                q_result = await session.execute(
                    select(QueueItem).where(QueueItem.lead_id == call_log.lead_id)
                    .order_by(QueueItem.created_at.desc())
                )
                q_item = q_result.scalars().first()
                
                if q_item and q_item.status not in ["INTENT_YES", "COMPLETED"]:
                    q_item.status = "INTENT_YES"
                    q_item.outcome = "Interested"
                    session.add(q_item)
                    
                    # Promote to user queue
                    try:
                        await session.commit()  # Commit changes first
                        promoted_item = await UserQueueWarmer.promote_to_user_queue(session, q_item.id)
                        if promoted_item:
                            promoted_count += 1
                            print(f"   -> Promoted to User Queue\n")
                    except Exception as e:
                        print(f"   -> Promotion failed: {e}\n")
                
                healed_count += 1
        
        await session.commit()
        print(f"\n✅ HEALING COMPLETE. Fixed {healed_count} calls. Promoted {promoted_count} to queue.")

if __name__ == "__main__":
    asyncio.run(heal_with_transcript_analysis())
