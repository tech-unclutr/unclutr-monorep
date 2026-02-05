from datetime import datetime

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.insight_feedback import InsightFeedback
from app.models.shopify.inventory import ShopifyInventoryLevel
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant


class WatchdogService:
    """
    Verifies if user-claimed fixes have actually occurred in the data.
    """

    async def run_verification_cycle(self, session: AsyncSession):
        """
        Scans all PENDING verification requests and checks against live data.
        """
        logger.info("Watchdog: Starting verification cycle")
        
        stmt = select(InsightFeedback).where(InsightFeedback.verification_status == "PENDING")
        result = await session.execute(stmt)
        pending_items = result.scalars().all()
        
        for item in pending_items:
            try:
                is_verified = await self._verify_item(session, item)
                if is_verified:
                    logger.info(f"Watchdog: Insight {item.insight_id} VERIFIED")
                    item.verification_status = "VERIFIED"
                    item.verified_at = datetime.utcnow()
                    session.add(item)
                else:
                    # Check for timeout? For now, just leave as PENDING until confirmed or manual fail.
                    # Ideally we check if enough time has passed to declare it FAILED.
                    pass
            except Exception as e:
                logger.error(f"Watchdog: Error verifying {item.id}: {e}")
                
        await session.commit()

    async def _verify_item(self, session: AsyncSession, item: InsightFeedback) -> bool:
        """
        Routes the verification to specific logic based on intent.
        """
        intent = item.verification_intent or {}
        action_type = intent.get("type")
        
        if not action_type:
            return False # Can't verify unknown intent
            
        if action_type == "archive_product":
            return await self._verify_archive(session, intent.get("product_id"))
            
        if action_type == "inventory_reduction":
             return await self._verify_inventory_drop(session, intent.get("variant_id"), intent.get("target_qty", 0))

        if action_type == "add_tag":
            return await self._verify_tag_added(session, intent.get("product_id"), intent.get("tag"))

        return False

    async def _verify_tag_added(self, session: AsyncSession, product_id: str, tag: str) -> bool:
        if not product_id or not tag:
            return False
            
        stmt = select(ShopifyProduct).where(str(ShopifyProduct.id) == str(product_id))
        result = await session.execute(stmt)
        product = result.scalar_one_or_none()
        
        if product and product.tags:
            # Tags are usually comma separated string or list. Handle both.
            if isinstance(product.tags, list):
                return tag in product.tags
            return tag.lower() in product.tags.lower()
            
        return False

    async def _verify_archive(self, session: AsyncSession, product_id: str) -> bool:
        if not product_id:
            return False
            
        # Normalize ID (Shopify IDs coming from UI are usually numbers, DB stores them as BigInt or numbers)
        # Assuming product_id is the Shopify ID.
        
        stmt = select(ShopifyProduct).where(str(ShopifyProduct.id) == str(product_id))
        result = await session.execute(stmt)
        product = result.scalar_one_or_none()
        
        if product and product.status == 'archived':
            return True
        return False

    async def _verify_inventory_drop(self, session: AsyncSession, variant_id: str, target_qty: int) -> bool:
        if not variant_id:
            return False
            
        # Join to find inventory level for this variant
        # This is tricky because inventory levels are separate.
        # Let's verify via ProductVariant.inventory_quantity if synced, or join InventoryItem.
        # Simplest: Check ShopifyProductVariant if it has a `inventory_quantity` field (it usually doesn't in normalized models, but let's check our model).
        
        stmt = select(ShopifyInventoryLevel).join(
            ShopifyInventoryItem
        ).join(
            ShopifyProductVariant,
            ShopifyInventoryItem.shopify_inventory_item_id == ShopifyProductVariant.shopify_inventory_item_id
        ).where(
            str(ShopifyProductVariant.shopify_variant_id) == str(variant_id)
        )
        
        result = await session.execute(stmt)
        level = result.scalar_one_or_none()
        
        if level and level.available <= target_qty:
            return True
            
        return False

watchdog_service = WatchdogService()
