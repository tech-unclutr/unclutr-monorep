import asyncio
import httpx
import json
import sys
import os

# Add parent dir to path to import app
sys.path.append(os.getcwd())

# Mock environment variables if needed
os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = "" # Dummy

from app.core.db import async_session_factory
from app.models.bolna_execution_map import BolnaExecutionMap
from sqlmodel import select

API_BASE = "http://localhost:8000/api/v1"

async def check_db(call_id):
    async with async_session_factory() as session:
        result = await session.execute(select(BolnaExecutionMap).where(BolnaExecutionMap.bolna_call_id == call_id))
        item = result.scalars().first()
        if item:
            print(f'Retrieved Summary: {item.transcript_summary}')
            if item.transcript_summary == 'VERIFICATION_SUMMARY: This is a test summary.':
                print('SUCCESS: Summary captured!')
                return True
            else:
                print('FAILURE: Summary mismatch.')
        else:
            print('FAILURE: Item not found.')
    return False

async def verify_flow():
    call_id = "e1a01960-2ace-4b1b-b1c8-0cf4dfb5b857"
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
        try:
            resp = await client.post(url, json=payload, timeout=10.0)
            print(f"Webhook Response: {resp.status_code} - {resp.json()}")
            
            if resp.status_code == 200:
                print("\nVerifying DB state...")
                await asyncio.sleep(1) # Small delay for commit
                await check_db(call_id)
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(verify_flow())
