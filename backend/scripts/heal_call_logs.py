import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

import json
from sqlmodel import select
from app.core.db import async_session_factory
from app.models.call_log import CallLog
from app.models.bolna_execution_map import BolnaExecutionMap
from app.core.agreement_utils import detect_agreement_status

async def heal_call_logs():
    async with async_session_factory() as session:
        print("\n=== Healing CallLog 'Disconnected' Entries ===\n")
        
        # Find all "Disconnected" call logs
        result = await session.execute(
            select(CallLog).where(CallLog.outcome == "Disconnected")
        )
        disconnected_logs = result.scalars().all()
        
        print(f"Found {len(disconnected_logs)} 'Disconnected' call logs to analyze.\n")
        
        healed_count = 0
        
        for log in disconnected_logs:
            # Get the execution map for this call
            exec_result = await session.execute(
                select(BolnaExecutionMap).where(
                    BolnaExecutionMap.bolna_call_id == log.bolna_call_id
                )
            )
            exec_map = exec_result.scalar_one_or_none()
            
            if not exec_map:
                print(f"⚠️  No execution map for call {log.bolna_call_id}, skipping...")
                continue
            
            # Re-run agreement detection
            extracted_data = exec_map.extracted_data or {}
            user_intent = extracted_data.get("user_intent", "")
            
            agreement_status = detect_agreement_status(
                user_intent=str(user_intent),
                outcome="DISCONNECTED",  # Original outcome
                extracted_data=extracted_data
            )
            
            is_strong_agreement = (
                agreement_status.get("agreed") is True and 
                agreement_status.get("status") == "yes" and 
                agreement_status.get("confidence") in ["high", "medium"]
            )
            
            if is_strong_agreement:
                print(f"⚡️ HEALING CallLog for Lead {log.lead_id}")
                print(f"   Call ID: {log.bolna_call_id}")
                print(f"   Old Outcome: {log.outcome}")
                print(f"   Agreement: {agreement_status}")
                print(f"   New Outcome: Interested\n")
                
                # Update the call log
                log.outcome = "Interested"
                log.status = "INTENT_YES"
                session.add(log)
                
                # Also update the execution map
                exec_map.call_outcome = "INTENT_YES"
                session.add(exec_map)
                
                healed_count += 1
        
        await session.commit()
        print(f"\n✅ HEALING COMPLETE. Fixed {healed_count} call logs.")

if __name__ == "__main__":
    asyncio.run(heal_call_logs())
