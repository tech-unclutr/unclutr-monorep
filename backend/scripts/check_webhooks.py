#!/usr/bin/env python3
"""
Check which webhooks are registered in Shopify for the integration.
"""
import asyncio
import httpx
import uuid
from sqlmodel import select
from app.core.db import engine
from app.models.integration import Integration
from app.services.shopify.oauth_service import shopify_oauth_service
from sqlmodel.ext.asyncio.session import AsyncSession

async def check_registered_webhooks(integration_id_str: str):
    integration_id = uuid.UUID(integration_id_str)
    
    async with AsyncSession(engine) as session:
        integration = await session.get(Integration, integration_id)
        if not integration:
            print(f"❌ Integration {integration_id} not found")
            return
        
        shop_domain = integration.metadata_info.get("shop")
        if not shop_domain:
            print("❌ No shop domain in metadata")
            return
        
        # Get access token
        token = await shopify_oauth_service.get_access_token(integration_id, session)
        
        # Query Shopify for registered webhooks
        url = f"https://{shop_domain}/admin/api/2024-01/webhooks.json"
        headers = {"X-Shopify-Access-Token": token}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code == 200:
                webhooks = response.json().get("webhooks", [])
                print(f"\n📡 Registered Webhooks for {shop_domain}")
                print(f"{'='*80}")
                print(f"Total: {len(webhooks)} webhooks\n")
                
                for wh in webhooks:
                    topic = wh.get("topic")
                    address = wh.get("address")
                    created = wh.get("created_at", "")[:10]
                    print(f"✓ {topic:30} → {address}")
                    print(f"  Created: {created}\n")
                
                if not webhooks:
                    print("⚠️  No webhooks registered! Run webhook registration.")
            else:
                print(f"❌ Failed to fetch webhooks: {response.status_code}")
                print(response.text)

if __name__ == "__main__":
    INTEGRATION_ID = "e261c1be-646b-4f5d-8d39-78a0454cb726"
    asyncio.run(check_registered_webhooks(INTEGRATION_ID))
