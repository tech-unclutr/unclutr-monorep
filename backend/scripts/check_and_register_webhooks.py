#!/usr/bin/env python3
"""
Check and register Shopify webhooks for real-time updates.
"""
import asyncio
import httpx
import uuid
from sqlmodel import select
from app.core.db import engine
from app.models.integration import Integration
from app.services.shopify.oauth_service import shopify_oauth_service
from sqlmodel.ext.asyncio.session import AsyncSession

async def check_and_register_webhooks(integration_id_str: str):
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
        
        # Check existing webhooks
        url = f"https://{shop_domain}/admin/api/2024-01/webhooks.json"
        headers = {"X-Shopify-Access-Token": token}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code == 200:
                webhooks = response.json().get("webhooks", [])
                print(f"\n📡 Current Webhooks for {shop_domain}")
                print(f"{'='*80}")
                print(f"Total: {len(webhooks)} webhooks\n")
                
                for wh in webhooks:
                    topic = wh.get("topic")
                    address = wh.get("address")
                    print(f"  {topic:30} → {address}")
                
                if not webhooks:
                    print("⚠️  No webhooks registered!")
                    print("\n🔧 Registering webhooks now...")
                    await shopify_oauth_service.register_webhooks(shop_domain, token)
                    print("✅ Webhooks registered!")
                else:
                    # Check if webhooks point to correct URL
                    correct_domain = "unwastable-godsent-see.ngrok-free.dev"
                    wrong_webhooks = [wh for wh in webhooks if correct_domain not in wh.get("address", "")]
                    
                    if wrong_webhooks:
                        print(f"\n⚠️  Found {len(wrong_webhooks)} webhooks with wrong URL!")
                        print("🔧 Re-registering webhooks...")
                        
                        # Delete old webhooks
                        for wh in webhooks:
                            delete_url = f"https://{shop_domain}/admin/api/2024-01/webhooks/{wh['id']}.json"
                            await client.delete(delete_url, headers=headers)
                        
                        # Register new ones
                        await shopify_oauth_service.register_webhooks(shop_domain, token)
                        print("✅ Webhooks re-registered with correct URL!")
            else:
                print(f"❌ Failed to fetch webhooks: {response.status_code}")
                print(response.text)

if __name__ == "__main__":
    INTEGRATION_ID = "e261c1be-646b-4f5d-8d39-78a0454cb726"
    asyncio.run(check_and_register_webhooks(INTEGRATION_ID))
