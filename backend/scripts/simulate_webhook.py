import asyncio
import uuid
import json
import httpx
import argparse
from datetime import datetime, timezone

async def send_mock_webhook(topic, shop, payload):
    url = f"http://localhost:8000/api/v1/integrations/shopify/webhooks/{topic}"
    
    headers = {
        "X-Shopify-Topic": topic,
        "X-Shopify-Shop-Domain": shop,
        "X-Shopify-Hmac-Sha256": "mock_hmac", # Bypassed in dev
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        print(f"Sending {topic} for {shop}...")
        try:
            response = await client.post(url, json=payload, headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")

async def main():
    parser = argparse.ArgumentParser(description="Simulate Shopify Webhooks")
    parser.add_argument("--topic", default="orders/create", help="Webhook topic")
    parser.add_argument("--shop", default="unclutr-dev.myshopify.com", help="Shop domain")
    parser.add_argument("--price", default="99.99", help="Order price (if topic is orders/create)")
    
    args = parser.parse_args()
    
    payload = {}
    if "orders" in args.topic:
        payload = {
            "id": int(datetime.now().timestamp()),
            "order_number": 1000 + int(datetime.now().timestamp()) % 1000,
            "total_price": args.price,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "currency": "USD",
            "customer": {
                "id": 12345,
                "first_name": "Antigravity",
                "last_name": "Test"
            },
            "line_items": [
                {"id": 99901, "title": "Magic Wand", "price": args.price, "quantity": 1}
            ]
        }
    elif "products" in args.topic:
        payload = {
            "id": int(datetime.now().timestamp()),
            "title": "New Cool Product",
            "vendor": "Unclutr",
            "product_type": "Gadget",
            "status": "active",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    elif "price_rules" in args.topic:
        payload = {
            "id": int(datetime.now().timestamp()),
            "title": "SPRING_SALE",
            "value_type": "percentage",
            "value": "-15.0",
            "customer_selection": "all"
        }
    
    await send_mock_webhook(args.topic, args.shop, payload)

if __name__ == "__main__":
    asyncio.run(main())
