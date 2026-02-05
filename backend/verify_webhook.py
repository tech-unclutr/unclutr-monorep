import asyncio
import httpx
import json

API_BASE = "http://localhost:8000/api/v1"

async def verify_flow():
    call_id = "e1a01960-2ace-4b1b-b1c8-0cf4dfb5b857"
    
    # CORRECT URL: /api/v1/integrations/webhook/bolna
    url = f"{API_BASE}/integrations/webhook/bolna"
    
    payload = {
        "execution_id": call_id,
        "status": "completed",
        "summary": "VERIFICATION_SUMMARY: This is a test summary.",
        "transcript": "Agent: Hello User: Hi Agent: Test? User: Yes.",
        "total_cost": 0.05,
        "telephony_data": {
            "duration": 45,
            "provider": "twilio"
        },
        "usage_breakdown": {
            "llm": {"cost": 0.02, "units": 150}
        },
        "latency_metrics": {
            "avg_latency": 150.5
        }
    }

    print(f"Sending mock webhook to {url} for {call_id}...")
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload)
        print(f"Webhook Response: {resp.status_code} - {resp.json()}")

if __name__ == "__main__":
    asyncio.run(verify_flow())
