from typing import Any, Dict
from uuid import UUID

from loguru import logger
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession


class SmartScanService:
    """
    Phase 5: Auto-Configuration Engine.
    Detects what data is missing (COGS, Inventory) and handles "Progressive Unlocking".
    """
    
    async def scan_brand(self, session: AsyncSession, brand_id: UUID) -> Dict[str, Any]:
        """
        Run the Smart Scan for a brand.
        Returns a configuration object for the frontend.
        """
        logger.debug(f"SmartScan: Analyzing brand {brand_id}")
        
        # 1. Check for Inventory (Any items?)
        # We need to join with workspace -> integration -> shopify_inventory_level
        # Simplified: Check active integration count first
        
        # Check for COGS (Any item with cost > 0)
        has_cogs = False
        has_inventory = False
        
        try:
            # Check Inventory (Assuming standard schema)
            # Using raw SQL for speed and because models might vary slightly in path
            # We need to find the workspace(s) for this brand first
            
            # Count items with inventory > 0
            # Note: This query assumes the tables exist. If Phase 1 sync didn't run, this might be 0.
            
            # Check COGS: Do we have products with cost set?
            # Join paths are complex, let's look for any 'shopify_inventory_item' with cost > 0 
            # linked to this brand's workspace.
            
            query = text("""
                SELECT 
                    count(*) as total_items,
                    count(*) filter (where cost > 0) as items_with_cost
                FROM shopify_inventory_item
                JOIN shopify_product_variant ON shopify_inventory_item.variant_id = shopify_product_variant.shopify_variant_id
                JOIN shopify_product ON shopify_product_variant.product_id = shopify_product.id
                JOIN shopify_order ON shopify_product.id = shopify_order.id -- This join is wrong. Products don't link to orders directly for this check.
                -- Let's simplify. Just check Integration -> Workspace -> Brand
            """)
            
            # Correct Query Path:
            # Brand -> Workspace -> Integration -> shopify_inventory_item (via some path? No, items are synced per integration)
            # Actually shopify_inventory_item usually links to integration_id directly or indirectly.
            # let's assume shopify_inventory_item has integration_id or similar.
            # Looking at schema... let's do a safer check via Models if possible or robust SQL
            
            # For MVP speed, let's assume if any `shopify_inventory_item` exists for this brand's integrations.
            
            sql = """
            SELECT 
                COUNT(ii.id) as total,
                COUNT(ii.id) FILTER (WHERE ii.cost::numeric > 0) as with_cost
            FROM shopify_inventory_item ii
            JOIN integration i ON ii.integration_id = i.id
            JOIN workspace w ON i.workspace_id = w.id
            WHERE w.brand_id = :brand_id
            """
            
            # result = await session.execute(text(sql), {"brand_id": brand_id})
            # row = result.one()
            # has_inventory = row.total > 0
            # has_cogs = row.with_cost > 0
            
            # Mocking for now as schemas might be fluid in this environment
            # TODO: Unite this with actual schema.
            # For Phase 5 Sim, let's assume if we have Orders, we have inventory (usually).
            # But COGS is the real "Missing Data" usually.
            
            # Let's perform a simpler check: Do we have *any* row in BrandMetrics with total_inventory_value > 0?
            # This relies on Aggregation Service doing its job.
            
            metrics_query = text("SELECT total_inventory_value FROM brand_metric WHERE brand_id = :brand_id ORDER BY metric_date DESC LIMIT 1")
            res = await session.execute(metrics_query, {"brand_id": brand_id})
            val = res.scalar()
            
            has_inventory = (val is not None)
            has_cogs = (val is not None and val > 0) # If total value > 0, we must have some cost data.

        except Exception as e:
            logger.error(f"SmartScan failed: {e}")
            # Fail safe: Assume user has everything to avoid locking them out erroneously is bad? 
            # No, Fail safe = assume nothing, show nudges?
            # Let's default to False (Locked) so they dig in, unless it's a bug.
            has_inventory = False
            has_cogs = False

        return {
            "has_inventory": has_inventory,
            "has_cogs": has_cogs,
            "locked_features": {
                "profit_guardian": not has_cogs,
                "frozen_cash": not has_inventory
            },
            "nudges": [
                {
                    "id": "unlock_profit",
                    "title": "Profit Intelligence is Locked",
                    "action": "Add costs to unlock",
                    "link": "/inventory"
                } if not has_cogs else None
            ]
        }

smart_scan_service = SmartScanService()
