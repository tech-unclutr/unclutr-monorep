
import json
import time
import requests
import uuid

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
API_KEY = "test_api_key" # Assuming we can mock or use a real token if needed, but for now relying on local dev env where auth might be bypassed or we need to login first.
# Actually, the endpoint requires auth. Let's try to simulate a heavy payload assuming we can get a valid token or just rely on the fact that I can run this against the local server if I have a token.
# To make it easier, I'll use the requests session if I can, or just print the curl command.
# Better: Use the existing check_db.py or similar to see how they authenticate.
# Or just assume we can use the "login" endpoint.

def measure_upload_performance():
    # 1. Generate 10k leads
    print("Generating 10k leads...")
    leads = []
    for i in range(10000):
        leads.append({
            "customer_name": f"Customer {i}",
            "contact_number": f"+1555000{i:05d}",
            "cohort": "Test Group",
            "meta_data": {"row": i, "notes": "Some long text data to make it heavier"}
        })
    
    payload = {
        "campaign_name": f"Perf Test {uuid.uuid4()}",
        "leads": leads,
        "force_create": True
    }
    
    # 2. Measure serialization time (Client side)
    t0 = time.time()
    json_payload = json.dumps(payload)
    t1 = time.time()
    print(f"Client Serialization Time: {t1 - t0:.4f}s")
    
    # 3. Send Request (We need headers)
    # For now, let's just print the size
    print(f"Payload Size: {len(json_payload) / 1024 / 1024:.2f} MB")
    
    # NOTE: To actually run this, we need a valid auth token. 
    # Since I don't have one handy in this script, I will just output the curl command 
    # or instruction on how to run it if I had the token.
    # However, I can try to login with a known dev user if available.
    
    print("\nTo run this test, use the following payload structure with a valid token.")
    # For the agent's purpose, I will assume I can modify the code to skip auth for a moment OR I will just implement the fix and rely on the user's report.
    # But I promised a reproduction script.
    
    # Let's try to mock the request locally if possible? No, it's a real HTTP request.
    
    # I will modify the script to accept a token as input or just generate the file.
    with open("large_payload.json", "w") as f:
        f.write(json_payload)
    print("Generated 'large_payload.json'. Run with:")
    print("curl -X POST http://localhost:8000/api/v1/intelligence/campaigns/create-from-csv \\")
    print("  -H 'Content-Type: application/json' \\")
    print("  -H 'X-Company-ID: <YOUR_COMPANY_ID>' \\")
    print("  -H 'Authorization: Bearer <YOUR_TOKEN>' \\")
    print("  -d @large_payload.json")

if __name__ == "__main__":
    measure_upload_performance()
