
import asyncio
from app.services.shopify.oauth_service import shopify_oauth_service

async def main():
    try:
        print("Testing validate_shop_domain...")
        shop_domain = "unclutr-dev.myshopify.com"
        
        is_valid = await shopify_oauth_service.validate_shop_domain(shop_domain)
        print(f"Shop: {shop_domain} - Reachable: {is_valid}")
        
        # Test invalid
        shop_domain_invalid = "invalid-store-xyz-123.myshopify.com"
        is_valid_inv = await shopify_oauth_service.validate_shop_domain(shop_domain_invalid)
        print(f"Shop: {shop_domain_invalid} - Reachable: {is_valid_inv}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
