import asyncio
from sqlmodel import select
from app.models.integration import Integration
from app.core.db import engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.services.shopify.oauth_service import shopify_oauth_service
from loguru import logger

async def retroactive_register():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        # Get all Shopify integrations
        stmt = select(Integration)
        result = await session.execute(stmt)
        integrations = result.scalars().all()
        
        logger.info(f"Found {len(integrations)} integrations to check.")
        
        for integration in integrations:
            shop = integration.metadata_info.get("shop")
            if not shop:
                logger.warning(f"Integration {integration.id} missing shop domain in metadata.")
                continue
                
            try:
                # Decrypt access token
                token = await shopify_oauth_service.get_access_token(integration.id, session)
                logger.info(f"Registering webhooks for {shop}")
                await shopify_oauth_service.register_webhooks(shop, token)
            except Exception as e:
                logger.error(f"Failed for {shop}: {e}")

if __name__ == "__main__":
    asyncio.run(retroactive_register())
