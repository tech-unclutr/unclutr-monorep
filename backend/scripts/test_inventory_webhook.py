#!/usr/bin/env python3
"""
Test script to simulate inventory_levels webhook and verify real-time stats update.
This simulates the exact scenario: changing inventory in Shopify and seeing it reflect in Unclutr.
"""
import asyncio
import httpx
import json
from datetime import datetime

# Configuration
WEBHOOK_URL = "http://localhost:8000/api/v1/shopify/webhooks/inventory_levels/update"
SHOP_DOMAIN = "unclutr-dev.myshopify.com"

# Sample inventory_levels/update payload (when stock changes to 0)
PAYLOAD = {
    "inventory_item_id": 50758656352480,  # Replace with actual inventory_item_id
    "location_id": 95827763424,           # Replace with actual location_id
    "available": 0,                        # Changed to 0 (sold out)
    "updated_at": datetime.utcnow().isoformat() + "Z"
}

async def test_inventory_webhook():
    """Simulate Shopify sending an inventory_levels/update webhook"""
    
    headers = {
        "Content-Type": "application/json",
        "X-Shopify-Topic": "inventory_levels/update",
        "X-Shopify-Shop-Domain": SHOP_DOMAIN,
        "X-Shopify-Hmac-Sha256": "dummy_hmac_dev_mode"  # Dev mode skips verification
    }
    
    print(f"🧪 Simulating inventory_levels/update webhook...")
    print(f"📦 Setting inventory to 0 for item {PAYLOAD['inventory_item_id']}")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                WEBHOOK_URL,
                json=PAYLOAD,
                headers=headers,
                timeout=30.0
            )
            
            print(f"\n✅ Webhook Response: {response.status_code}")
            print(f"📄 Response Body: {response.json()}")
            
            if response.status_code == 200:
                print("\n✨ Success! Check your Unclutr dashboard:")
                print("   1. Go to Integrations -> Shopify -> Detail Drawer")
                print("   2. Watch 'Inventory Units' count decrease")
                print("   3. Should update within 30 seconds")
            else:
                print(f"\n❌ Webhook failed with status {response.status_code}")
                
        except Exception as e:
            print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_inventory_webhook())
