import asyncio
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.api.v1.endpoints.execution import get_campaign_realtime_status_internal
from app.core.config import settings
from uuid import UUID

async def verify_history_data():
    engine = create_async_engine(settings.DATABASE_URL)
    async with AsyncSession(engine) as session:
        # Using a sample campaign ID from previous outputs
        campaign_id = UUID('f54477bc-8d99-43d2-b02d-8e77f3295de2')
        print(f"Fetching history for campaign: {campaign_id}")
        
        try:
            result = await get_campaign_realtime_status_internal(campaign_id, session)
            history_data = result.get('history', [])
            
            if not history_data:
                print(f"No history found for this campaign. Result keys: {result.keys()}")
                return

            print(f"Found {len(history_data)} history items.")
            
            # Check the first item
            item = history_data[0]
            print("\nSAMPLE HISTORY ITEM:")
            print(json.dumps({
                "name": item.get("name"),
                "outcome": item.get("outcome"),
                "extracted_data": item.get("extracted_data"),
                "usage_breakdown": item.get("raw_data", {}).get("usage_breakdown"),
                "latency_metrics": item.get("raw_data", {}).get("latency_metrics"),
                "has_full_transcript": bool(item.get("full_transcript"))
            }, indent=2))
            
            # Validation
            assert "extracted_data" in item, "Missing extracted_data"
            assert "raw_data" in item, "Missing raw_data"
            assert "usage_breakdown" in item["raw_data"], "Missing usage_breakdown in raw_data"
            assert "latency_metrics" in item["raw_data"], "Missing latency_metrics in raw_data"
            print("\nVERIFICATION SUCCESSFUL: Enriched data fields are present.")

        except Exception as e:
            print(f"Verification failed with error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(verify_history_data())
