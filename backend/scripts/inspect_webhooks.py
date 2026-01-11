import asyncio
import httpx
import uuid
import sys
import os
from sqlmodel import select, col
from app.core.db import engine, get_session
from app.models.integration import Integration

async def check_webhooks():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    # Get the active shopify integration
    stmt = select(Integration).where(Integration.status == "active")
    result = await session.execute(stmt)
    integrations = result.scalars().all()
    
    integration = None
    for integ in integrations:
        if integ.metadata_info and "shop" in integ.metadata_info:
            integration = integ
            break
    
    if not integration:
        print("No integration found!")
        return

    meta = integration.metadata_info
    shop = meta["shop"]
    token = integration.credentials.get("access_token")
    
    if not token:
        # It's encrypted. Need to decrypt?
        # Assuming existing service logic or just raw access if stored in credentials JSON.
        # Wait, OAuth service encrypts it. 
        # I'll rely on Oauth service to decrypt or simple verify.
        # Let's try to decrypt using Encryption helper if needed.
        # But wait, credentials field is JSONB. 
        # Typically Unclutr stores encrypted string in "access_token".
        pass
        
    # Use oauth service to get token safely
    from app.services.shopify.oauth_service import shopify_oauth_service
    token = await shopify_oauth_service.get_access_token(integration.id, session)

    print(f"Checking Webhooks for {shop}...")
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://{shop}/admin/api/2024-01/webhooks.json",
            headers={"X-Shopify-Access-Token": token}
        )
        
        if resp.status_code == 200:
            webhooks = resp.json().get("webhooks", [])
            print(f"Found {len(webhooks)} webhooks.")
            for wh in webhooks:
                print(f"- Topic: {wh['topic']}") 
                print(f"  Address: {wh['address']}")
                print(f"  Format: {wh['format']}")
        else:
            print(f"Failed to fetch webhooks: {resp.status_code} {resp.text}")

if __name__ == "__main__":
    asyncio.run(check_webhooks())
