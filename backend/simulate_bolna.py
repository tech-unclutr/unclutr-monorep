import asyncio
import httpx
import sys

async def simulate_webhook(call_id, status, transcript=None, interested=False):
    url = "http://localhost:8000/api/v1/integrations/webhook/bolna"
    
    payload = {
        "call_id": call_id,
        "status": status,
        "duration": 10 if status == "completed" else 0,
        "total_cost": 0.05 if status == "completed" else 0,
        "currency": "USD"
    }
    
    if transcript:
        payload["transcript"] = transcript
    
    if interested:
        payload["extracted_data"] = {"interested": True}
    
    print(f"Sending status: {status} for call: {call_id}...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload)
        print(f"Response: {response.status_code} - {response.json()}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python simulate_bolna.py <call_id>")
        sys.exit(1)
        
    call_id = sys.argv[1]
    
    async def run():
        # 1. Ringing
        await simulate_webhook(call_id, "ringing")
        await asyncio.sleep(2)
        
        # 2. Speaking
        await simulate_webhook(call_id, "speaking", transcript=[{"role": "agent", "content": "Hello, is this John?"}])
        await asyncio.sleep(2)
        
        # 3. Listening
        await simulate_webhook(call_id, "listening", transcript=[{"role": "agent", "content": "Hello, is this John?"}, {"role": "user", "content": "Yes, this is John."}])
        await asyncio.sleep(2)
        
        # 4. Completed
        await simulate_webhook(call_id, "completed", transcript=[{"role": "agent", "content": "Great, just calling about..."}, {"role": "user", "content": "I am interested."}], interested=True)

    asyncio.run(run())
