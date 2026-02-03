
import asyncio
import httpx
import uuid
import json
from datetime import datetime

# Configuration
API_URL = "http://localhost:8000"
# API_URL = "https://unwastable-godsent-see.ngrok-free.dev" # Use ngrok if you want to test via public URL

async def test_bolna_webhook():
    print(f"Testing Bolna Webhook against {API_URL}...")
    
    # 1. Create a dummy campaign (or find one) via API would be ideal, but for now let's just 
    # generate a random execution ID and expect it to fail lookup BUT log robustly.
    # OR better, let's try to assume there's a campaign with a specific ID if we knew one.
    # Let's rely on the parsing logic.
    
    # Mock Payload mimicking the structure we expect
    execution_id = str(uuid.uuid4())
    agent_id = "test-agent-123"
    
    payload = {
        "id": execution_id,
        "agent_id": agent_id,
        "status": "completed",
        "conversation_time": 120,
        "total_cost": 50,
        "transcript": "Speaker 1: Hello. Speaker 2: Hi, I want to discuss the new feature.",
        "context_data": {
            "campaign_id": "00000000-0000-0000-0000-000000000000", # Dummy UUID, likely won't spawn a campaign unless we create one first
            "user_id": "test-user",
            "extracted_data": {
                "campaign_overview": {
                    "primary_goal": "Test Goal",
                    "goal_type": "Research"
                }
            }
        },
        "extracted_data": {
            "campaign_overview": {
                "primary_goal": "Test Goal",
                "goal_type": "Research"
            },
            "execution_details": {
                "success_criteria": "Clear signal"
            }
        },
        "telephony_data": {
            "duration": 125,
            "cost": 0.05
        },
        "created_at": datetime.utcnow().isoformat() + "Z",
        "updated_at": datetime.utcnow().isoformat() + "Z"
    }
    
    print(f"Sending webhook with execution_id: {execution_id}")
    
    async with httpx.AsyncClient() as client:
        try:
            # Correct Endpoint from bolna_webhook.py router
            response = await client.post(
                f"{API_URL}/api/v1/integrations/webhook/bolna",
                json=payload,
                timeout=10.0
            )
            
            print(f"Response Status: {response.status_code}")
            print(f"Response Body: {response.text}")
            
            if response.status_code == 200:
                print("✅ Webhook sent successfully!")
            else:
                print("❌ Webhook request failed.")
                
        except Exception as e:
             print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    asyncio.run(test_bolna_webhook())
