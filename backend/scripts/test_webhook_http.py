import httpx
import asyncio
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker
from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.integration import Integration, IntegrationStatus

async_session_factory = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def test_webhook_endpoint():
    async with async_session_factory() as session:
        # Specifically get the active integration we just enabled
        res = await session.execute(select(Integration).where(Integration.status == IntegrationStatus.ACTIVE))
        integration = res.scalars().first()
        if not integration or not integration.metadata_info.get("shop"):
             print("❌ No active integration with shop metadata found.")
             return
             
        shop_domain = integration.metadata_info.get("shop")
        print(f"🔄 Target Shop: {shop_domain}")

    # 2. Simulate Webhook via HTTP
    url = f"http://localhost:8000/api/v1/integrations/shopify/webhooks/products/update"
    headers = {
        "X-Shopify-Topic": "products/update",
        "X-Shopify-Shop-Domain": shop_domain,
        "X-Shopify-Hmac-Sha256": "fake-hmac-for-dev",
        "Content-Type": "application/json"
    }
    payload = {
        "id": 777333,
        "title": "Webhook Updated Product",
        "vendor": "Webhook Vendor",
        "variants": [
            {
                "id": 666444,
                "price": "29.99"
            }
        ]
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers)
            print(f"📡 Webhook POST Result: {response.status_code}")
            print(f"📦 Response Body: {response.json()}")
            
            if response.status_code == 200:
                print("✅ Webhook router is functional.")
            else:
                print("❌ Webhook router failed.")
        except Exception as e:
            print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    asyncio.run(test_webhook_endpoint())
