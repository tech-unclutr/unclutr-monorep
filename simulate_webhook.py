
import asyncio
import httpx
import json
from sqlmodel import select
from app.core.db import engine
from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.models.integration import Integration

async def simulate_webhook():
    async with engine.connect() as conn:
        res = await conn.execute(select(Integration).where(Integration.status == "active").limit(1))
        integration = res.first()
        if not integration:
            print("No active integration found")
            return
        
        shop = integration.metadata_info.get("shop")
        print(f"Using shop: {shop}")
        
        payload = {
            "id": 999999999,
            "order_number": 9999,
            "total_price": "100.00",
            "currency": "USD",
            "updated_at": "2024-01-01T12:00:00Z"
        }
        
        headers = {
            "X-Shopify-Topic": "orders/create",
            "X-Shopify-Shop-Domain": shop,
            "X-Unclutr-Dev-Bypass": "local-dev-bypass"
        }
        
        print("Sending mock webhook...")
        async with httpx.AsyncClient() as client:
            # Correct mounted path: /api/v1/integrations/shopify/webhooks/{topic}
            url = "http://localhost:8000/api/v1/integrations/shopify/webhooks/orders/create"
            response = await client.post(url, json=payload, headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
        if response.status_code == 200:
            # Check DB
            await asyncio.sleep(2) # Wait for async processing
            from sqlmodel.ext.asyncio.session import AsyncSession
            async with AsyncSession(engine) as session:
                stmt = select(ShopifyRawIngest).where(
                    ShopifyRawIngest.shopify_object_id == 999999999
                )
                res = await session.execute(stmt)
                ingest = res.scalars().first()
                if ingest:
                    print(f"SUCCESS! Ingested record found with status: {ingest.processing_status}")
                else:
                    print("FAILURE: Ingested record NOT found in DB")

if __name__ == "__main__":
    asyncio.run(simulate_webhook())
