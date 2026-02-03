import httpx
import asyncio
from app.core.config import settings

async def test_bolna_call():
    api_key = settings.BOLNA_API_KEY
    agent_id = settings.BOLNA_AGENT_ID
    # Force the correct base URL for testing
    base_url = "https://api.bolna.ai"
    
    print(f"Testing Bolna API /call:")
    print(f"Base URL: {base_url}")
    print(f"Agent ID: {agent_id}")
    
    if not api_key or not agent_id:
        print("ERROR: Missing API Key or Agent ID")
        return

    url = f"{base_url}/call"
    headers = {"Authorization": f"Bearer {api_key}"}
    
    # Payload according to documentation: /call expects agent_id, recipient_phone_number, and user_data
    payload = {
        "agent_id": agent_id,
        "recipient_phone_number": "+919737149414", # Real test number from database
        "user_data": {
            "first_name": "Test",
            "brand_name": "Unclutr"
        }
    }
    
    try:
        async with httpx.AsyncClient() as client:
            print(f"Sending request to {url}...")
            response = await client.post(url, json=payload, headers=headers, timeout=10.0)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            # Even if it's 400 (e.g. invalid number), it's better than 404!
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_bolna_call())
