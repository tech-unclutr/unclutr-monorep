"""
Test CSV upload endpoint after server restart
"""
import requests
import json

# Test data
payload = {
    "campaign_name": "Test Campaign - Metadata Fix",
    "leads": [
        {
            "customer_name": "Test User 1",
            "contact_number": "+1234567890",
            "cohort": "TestCohort"
        },
        {
            "customer_name": "Test User 2",
            "contact_number": "+0987654321"
        }
    ]
}

headers = {
    "Content-Type": "application/json",
    "X-Company-ID": "28233392-a23b-4f2d-b051-fb9d8cc7c97b",  # From logs
    "Authorization": "Bearer secret"  # Dev token
}

print("Testing CSV upload endpoint...")
print(f"Payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(
        "http://localhost:8000/api/v1/intelligence/campaigns/create-from-csv",
        json=payload,
        headers=headers,
        timeout=10
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✅ SUCCESS! CSV upload is working!")
    else:
        print(f"\n❌ Failed with status {response.status_code}")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
