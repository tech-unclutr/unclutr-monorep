import asyncio
import httpx
import json
import uuid
import time
from datetime import datetime, timezone
from typing import Dict, List

# Configuration
BASE_URL = "http://localhost:8000/api/v1/integrations/shopify"
SHOP_DOMAIN = "unclutr-dev.myshopify.com" # Updated to match local DB
BYPASS_HEADER = {"X-Unclutr-Dev-Bypass": "local-dev-bypass"}

async def send_webhook(client: httpx.AsyncClient, topic: str, payload: Dict):
    headers = {
        **BYPASS_HEADER,
        "X-Shopify-Topic": topic,
        "X-Shopify-Shop-Domain": SHOP_DOMAIN,
        "Content-Type": "application/json"
    }
    url = f"{BASE_URL}/webhooks/{topic}"
    try:
        resp = await client.post(url, headers=headers, json=payload)
        return resp.status_code
    except Exception as e:
        print(f"Error sending {topic}: {e}")
        return 500

async def stress_test_webhooks():
    print(f"🚀 Starting Shopify Webhook Stress Test for {SHOP_DOMAIN}...\n")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Test HMAC Security (Expect 401 without bypass)
        print("🛡️ Testing Security (HMAC Validation)...")
        resp = await client.post(
            f"{BASE_URL}/webhooks/orders/create",
            headers={"X-Shopify-Topic": "orders/create", "X-Shopify-Shop-Domain": SHOP_DOMAIN},
            json={"id": 123}
        )
        if resp.status_code == 401:
            print("✅ PASS: Unauthorized without HMAC/Bypass.")
        else:
            print(f"❌ FAIL: Expected 401, got {resp.status_code}")

        # 2. Simulate Batch of Orders (Ingestion Test)
        print("\n📥 Simulating burst of 20 Order Webhooks...")
        order_tasks = []
        for i in range(20):
            payload = {
                "id": 9000000 + i,
                "name": f"#STRESS-{i}",
                "email": f"stress-test-{i}@example.com",
                "total_price": "99.99",
                "financial_status": "paid",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            order_tasks.append(send_webhook(client, "orders/create", payload))
        
        results = await asyncio.gather(*order_tasks)
        successful = [r for r in results if r == 200]
        print(f"📊 Results: {len(successful)}/20 successful ingestions.")

        # 3. Simulate High-Frequency Stock Updates (Update Race Condition Test)
        print("\n📉 Simulating rapid Inventory Updates for same item...")
        inventory_item_id = 8880001
        inv_tasks = []
        for i in range(10):
            payload = {
                "inventory_item_id": inventory_item_id,
                "location_id": 7770001,
                "available": 100 - i, # Decrementing stock
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            inv_tasks.append(send_webhook(client, "inventory_levels/update", payload))
            # Tiny delay to mimic sequential arrival but still fast
            await asyncio.sleep(0.05)
        
        results = await asyncio.gather(*inv_tasks)
        print(f"✅ Dispatched {len(results)} inventory updates.")

        # 4. Deduplication Test (Send same payload twice)
        print("\n👯 Testing Deduplication Logic...")
        payload = {"id": 9500001, "title": "Dedupe Me", "updated_at": "2026-01-12T12:00:00Z"}
        r1 = await send_webhook(client, "products/update", payload)
        r2 = await send_webhook(client, "products/update", payload)
        print(f"✅ Sent duplicate product update. Responses: {r1}, {r2}")

    print("\n🏁 Stress Test Dispatch Complete. Check logs for refinement status.")

if __name__ == "__main__":
    asyncio.run(stress_test_webhooks())
