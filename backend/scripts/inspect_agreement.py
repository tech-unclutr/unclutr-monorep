
import asyncio
from app.core.db import async_session_factory
from sqlmodel import select
from app.models.campaign_lead import CampaignLead
from app.models.bolna_execution_map import BolnaExecutionMap
from app.models.queue_item import QueueItem
from app.core.agreement_utils import detect_agreement_status

async def main():
    async with async_session_factory() as session:
        # 1. Get the lead "Param"
        lead_id = 'e8d87cf5-024a-4dd3-8682-fbb7ffd69055' # From previous logs
        
        print(f"--- Inspecting Lead {lead_id} ---")
        lead = await session.get(CampaignLead, lead_id)
        print(f"Lead Status: {lead.status}")
        
        # 2. Get QueueItem
        q_result = await session.execute(select(QueueItem).where(QueueItem.lead_id == lead_id))
        q_item = q_result.scalar_one_or_none()
        print(f"QueueItem Status: {q_item.status if q_item else 'None'}")
        print(f"QueueItem Outcome: {q_item.outcome if q_item else 'None'}")
        print(f"QueueItem Closure Reason: {q_item.closure_reason if q_item else 'None'}")
        
        # 3. Get BolnaExecutionMap
        b_result = await session.execute(
            select(BolnaExecutionMap).where(BolnaExecutionMap.queue_item_id == q_item.id)
        )
        b_map = b_result.scalars().first()
        
        if b_map:
            print("\n--- Bolna Execution Map ---")
            print(f"Call Status: {b_map.call_status}")
            print(f"Extracted Data: {b_map.extracted_data}")
            print(f"User Intent (Enriched): {b_map.extracted_data.get('user_intent')}")
            print(f"Transcript Summary: {b_map.transcript_summary}")
            print(f"Transcript: {b_map.transcript[:200]}..." if b_map.transcript else "None")
            
            # 4. Re-run Agreement Detection
            print("\n--- Re-running Agreement Detection ---")
            agreement = detect_agreement_status(
                user_intent=str(b_map.extracted_data.get('user_intent', '')),
                outcome=b_map.call_status, # Use call status as proxy for what webhook saw
                extracted_data=b_map.extracted_data,
                transcript_text=b_map.transcript or ""
            )
            print(f"Detected Agreement: {agreement}")
            
            # 5. Check if it should have been promoted
            is_promotable = (agreement.get("agreed") and agreement.get("confidence") in ["high", "medium"])
            print(f"Should be Promotable? {is_promotable}")
            
        else:
            print("No BolnaExecutionMap found.")

if __name__ == "__main__":
    asyncio.run(main())
