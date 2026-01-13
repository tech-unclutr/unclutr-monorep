
import asyncio
import uuid
from app.services.shopify.oauth_service import shopify_oauth_service

async def main():
    try:
        print("Testing generate_authorization_url...")
        company_id = uuid.uuid4()
        shop_domain = "unclutr-dev.myshopify.com"
        
        url = await shopify_oauth_service.generate_authorization_url(shop_domain, company_id)
        print(f"Success! URL: {url}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
