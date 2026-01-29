import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from unittest.mock import MagicMock
from app.services.intelligence.campaign_service import campaign_service
from app.models.campaign import Campaign

async def test_fix():
    print("Testing Bolna Campaign ID Fix...")
    
    # Mock campaign
    campaign = Campaign(name="Old Name", status="INITIATED")
    # Manually set ID since it might be UUID in real model but string here is fine for mock check, 
    # unless uuid parsing happens. The service uses campaign.id in logging but doesn't validate it in this method.
    
    # Mock payload with context_data
    payload = {
        "id": "exec-123",
        "context_data": {
            "campaign_id": "test-campaign-id-123",
            "user_id": "user-123"
        },
        "extracted_data": {"primary_goal": "Test Goal"}
    }
    
    try:
        # Run the method
        # We need to mock generate_campaign_name because it calls LLM service
        future = asyncio.Future()
        future.set_result("Generated Campaign Name")
        campaign_service.generate_campaign_name = MagicMock(return_value=future)
        
        await campaign_service._apply_bolna_data_to_campaign(campaign, payload)
        
        # Verify
        print(f"\nFinal Extracted Data: {campaign.bolna_extracted_data}")
        
        if "_metadata" in campaign.bolna_extracted_data:
            metadata = campaign.bolna_extracted_data["_metadata"]
            if metadata.get("campaign_id") == "test-campaign-id-123":
                print("\n✅ SUCCESS: _metadata found and campaign_id matches!")
            else:
                print("\n❌ FAILURE: campaign_id mismatch")
        else:
            print("\n❌ FAILURE: _metadata key missing")
            
    except Exception as e:
        print(f"\n❌ EXCEPTION: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_fix())
