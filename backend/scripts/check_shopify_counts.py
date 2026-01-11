import asyncio
import uuid
import httpx
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.models.integration import Integration
from app.services.shopify.oauth_service import shopify_oauth_service

async def check_real_counts():
    integration_id = uuid.UUID("db3fbde7-0bb7-49c3-b402-46b353217d61")
    async_session = AsyncSession(engine)
    
    token = await shopify_oauth_service.get_access_token(integration_id, async_session)
    integration = await async_session.get(Integration, integration_id)
    shop_domain = integration.metadata_info["shop"]
    api_version = "2024-10" # Using latest for checkout count etc

    async with httpx.AsyncClient() as client:
        # Orders
        resp = await client.get(f"https://{shop_domain}/admin/api/{api_version}/orders/count.json?status=any", headers={"X-Shopify-Access-Token": token})
        print(f"Orders Count: {resp.json()}")
        
        # Products
        resp = await client.get(f"https://{shop_domain}/admin/api/{api_version}/products/count.json", headers={"X-Shopify-Access-Token": token})
        print(f"Products Count: {resp.json()}")
        
        # Customers
        resp = await client.get(f"https://{shop_domain}/admin/api/{api_version}/customers/count.json", headers={"X-Shopify-Access-Token": token})
        print(f"Customers Count: {resp.json()}")

    await async_session.close()

if __name__ == "__main__":
    asyncio.run(check_real_counts())
