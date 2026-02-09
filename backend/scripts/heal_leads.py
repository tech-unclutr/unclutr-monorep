import asyncio
import logging
import sys
from pathlib import Path

# Add backend directory (parent of scripts/) to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from datetime import datetime
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import async_session_factory
from app.models.queue_item import QueueItem
from app.models.bolna_execution_map import BolnaExecutionMap
from app.core.agreement_utils import detect_agreement_status, should_copy_to_queue
from app.services.user_queue_warmer import UserQueueWarmer
from app.models.call_log import CallLog

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def heal_leads():
    async with async_session_factory() as session:
        logger.info("Starting Healer Script...")
        
        # 1. Find candidates: QueueItems that are Disconnected/Ambiguous
        # but might have Agreement.
        query = select(QueueItem, BolnaExecutionMap).join(
            BolnaExecutionMap, QueueItem.id == BolnaExecutionMap.queue_item_id
        ).where(
            col(QueueItem.status).in_(["DISCONNECTED", "AMBIGUOUS", "FAILED_CONNECT"])
        )
        
        result = await session.execute(query)
        candidates = result.all()
        
        logger.info(f"Found {len(candidates)} candidates to scan.")
        
        healed_count = 0
        promoted_count = 0
        
        for q_item, exec_map in candidates:
             # Re-run agreement detection
            transcript_str = str(exec_map.transcript or "")
            enriched_intent = (exec_map.extracted_data or {}).get("user_intent", "")
            
            agreement_status = detect_agreement_status(
                user_intent=str(enriched_intent),
                outcome=q_item.status,
                extracted_data=exec_map.extracted_data
            )
            
            is_strong_agreement = (
                agreement_status.get("agreed") is True and 
                agreement_status.get("status") == "yes" and 
                agreement_status.get("confidence") in ["high", "medium"]
            )
            
            if is_strong_agreement:
                logger.info(f"⚡️ HEALING Lead {q_item.lead_id} | Status: {q_item.status} -> INTENT_YES")
                
                # 1. Fix Status
                q_item.status = "INTENT_YES"
                q_item.outcome = "Interested"
                session.add(q_item)
                
                exec_map.call_outcome = "INTENT_YES"
                session.add(exec_map)
                
                # 2. Fix CallLog if exists
                log_stmt = select(CallLog).where(CallLog.bolna_call_id == exec_map.bolna_call_id)
                log_res = await session.execute(log_stmt)
                call_log = log_res.scalars().first()
                if call_log:
                    call_log.status = "INTENT_YES"
                    call_log.outcome = "Interested"
                    session.add(call_log)
                
                # Commit changes before promotion
                await session.commit()
                
                # 3. Promote to User Queue
                try:
                    promoted_item = await UserQueueWarmer.promote_to_user_queue(session, q_item.id)
                    if promoted_item:
                        promoted_count += 1
                        logger.info(f"   -> Promoted to User Queue (ID: {promoted_item.id})")
                    else:
                        logger.info("   -> Already promoted (or failed)")
                except Exception as e:
                    logger.error(f"   -> Failed to promote: {e}")
                
                healed_count += 1
                
        logger.info(f"✅ HEALING COMPLETE. Fixed {healed_count} leads. Promoted {promoted_count} to queue.")

if __name__ == "__main__":
    asyncio.run(heal_leads())
