import requests
import json
import uuid

API_URL = "http://localhost:8000/api/v1/intelligence"
HEADERS = {"X-Company-ID": "00000000-0000-0000-0000-000000000000"} # Mock company ID

def test_playbook():
    print("Testing Playbook API...")
    try:
        res = requests.get(f"{API_URL}/playbook/slow_movers", headers=HEADERS)
        if res.status_code == 200:
            data = res.json()
            # print(json.dumps(data, indent=2))
            if "ui_config" in data["simulation_params"] and "impact_factor" in data["simulation_params"]["ui_config"]:
                print("✅ Playbook API returns UI Config with impact_factor")
            else:
                print("❌ Playbook API missing UI Config")
        else:
            print(f"❌ Playbook API failed: {res.status_code}")
    except Exception as e:
        print(f"❌ Playbook API validation failed: {e}")

def test_feedback_schema():
    print("\nTesting Feedback Submission (Schema Check)...")
    payload = {
        "insight_id": "test_insight_1",
        "brand_id": str(uuid.uuid4()),
        "status": "ACCEPTED",
        "verification_intent": {
            "type": "add_tag",
            "tag": "Clearance",
            "product_id": "12345"
        },
        "user_comment": "Testing watchdog"
    }
    
    # We expect 403 or 500 because Company/Brand doesn't exist, but we want to fail on Logic not Pydantic
    try:
        res = requests.post(f"{API_URL}/feedback", json=payload, headers=HEADERS)
        if res.status_code == 422:
             print("❌ Feedback Validation Error (Pydantic Mismatch)")
             print(res.json())
        elif res.status_code == 403:
             print("✅ Feedback Endpoint reachable (rejected due to mock ID as expected)")
        else:
             print(f"⚠️ Feedback API returned {res.status_code} (Check logs if this is unexpected)")
    except Exception as e:
         print(f"❌ Feedback API failed: {e}")

if __name__ == "__main__":
    test_playbook()
    test_feedback_schema()
