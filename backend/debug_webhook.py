
import requests
import json
import asyncio

URL = "http://localhost:8000/api/v1/integrations/webhook/bolna"

payload = {
    "execution_id": "0c351111-ea87-4e84-a611-dc0b7cf44b7b",
    "status": "ringing",
    "duration": 5,
    "total_cost": 0.01,
    "currency": "USD"
}

def send_webhook():
    try:
        response = requests.post(URL, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_webhook()
