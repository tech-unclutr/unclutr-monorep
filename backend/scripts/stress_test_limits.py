import asyncio
import httpx
import time
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

async def stress_test():
    url = "http://localhost:8000/api/v1/integrations/shopify/webhooks/orders/create"
    headers = {
        "X-Shopify-Topic": "orders/create",
        "X-Shopify-Shop-Domain": "test-stress-shop.myshopify.com",
        "X-Shopify-Hmac-Sha256": "fake_hmac"
    }
    
    print(f"🔥 Starting Stress Test on {url}")
    print("Goal: Send 300 requests in < 1 minute.")
    print("Expectation: Should hit 429 Too Many Requests after ~200.")
    
    results = {
        200: 0,
        401: 0,
        429: 0,
        "other": 0
    }
    
    start_time = time.time()
    
    async with httpx.AsyncClient() as client:
        tasks = []
        for _ in range(300):
            tasks.append(client.post(url, headers=headers, json={"id": 123}))
            
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
    duration = time.time() - start_time
    
    for r in responses:
        if isinstance(r, Exception):
            print(f"Error: {r}")
            continue
        
        if r.status_code == 429:
            results[429] += 1
        elif r.status_code == 401:
            results[401] += 1
        elif r.status_code == 200:
            results[200] += 1
        else:
            if r.status_code not in results: results[r.status_code] = 0
            results[r.status_code] += 1
            
    print(f"\n✅ Finished in {duration:.2f} seconds.")
    print("Results:")
    print(f"  🟢 200 OK: {results[200]}")
    print(f"  🟡 401 Unauthorized: {results[401]}")
    print(f"  🔴 429 Too Many Requests: {results[429]}")
    print(f"  ❓ Other: { {k:v for k,v in results.items() if k not in [200, 401, 429]} }")
    
    if results[429] > 0:
        print("\n🏆 SUCCESS: Rate Limiter is Active and Blocking.")
    else:
        print("\n❌ FAILURE: No Rate Limiting detected.")

if __name__ == "__main__":
    asyncio.run(stress_test())
