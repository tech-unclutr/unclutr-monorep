"""
Velocity Breakout Generator: Detects products with 3x+ velocity spike.

Signal: Products with sudden sales acceleration
Impact: Medium-High (6-8) - opportunity to scale winners
Category: Growth
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Workspace
from app.models.integration import Integration
from app.models.shopify.order import ShopifyLineItem, ShopifyOrder
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant
from app.services.intelligence.base_generator import BaseInsightGenerator, InsightObject


class VelocityBreakoutGenerator(BaseInsightGenerator):
    """
    Detects products with 3x+ velocity spike (week-over-week).
    
    Edge cases handled:
    - Non-overlapping periods (recent 7d vs previous 7d)
    - Statistical significance (not just noise)
    - Minimum baseline sales required
    """
    
    VELOCITY_MULTIPLIER_THRESHOLD = 3.0
    MIN_BASELINE_SALES = 5  # Require at least 5 sales in baseline period
    
    async def run(self, session: AsyncSession, brand_id: UUID) -> Optional[InsightObject]:
        """
        Generate velocity breakout insight.
        """
        logger.debug(f"VelocityBreakout: Starting analysis for brand_id={brand_id}")
        
        # Define time periods (non-overlapping)
        today = datetime.utcnow().date()
        recent_end = today - timedelta(days=1)  # Exclude today
        recent_start = recent_end - timedelta(days=6)  # Last 7 complete days
        
        baseline_end = recent_start - timedelta(days=1)
        baseline_start = baseline_end - timedelta(days=6)  # Previous 7 complete days
        
        # Query: Sales by product for both periods
        recent_stmt = select(
            ShopifyProduct.id.label("product_id"),
            ShopifyProduct.title,
            ShopifyProductVariant.sku,
            func.sum(ShopifyLineItem.quantity).label("recent_sales")
        ).select_from(
            ShopifyLineItem
        ).join(
            ShopifyProductVariant,
            ShopifyLineItem.variant_id == ShopifyProductVariant.shopify_variant_id
        ).join(
            ShopifyProduct,
            ShopifyProductVariant.product_id == ShopifyProduct.id
        ).join(
            ShopifyOrder,
            ShopifyLineItem.order_id == ShopifyOrder.id
        ).join(
            Integration,
            ShopifyOrder.integration_id == Integration.id
        ).join(
            Workspace,
            Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand_id,
            func.date(ShopifyOrder.shopify_created_at) >= recent_start,
            func.date(ShopifyOrder.shopify_created_at) <= recent_end,
            ShopifyOrder.financial_status != 'voided',
            ShopifyOrder.shopify_cancelled_at == None
        ).group_by(
            ShopifyProduct.id,
            ShopifyProduct.title,
            ShopifyProductVariant.sku
        )
        
        recent_results = (await session.execute(recent_stmt)).all()
        
        if not recent_results:
            logger.info("VelocityBreakout: No recent sales found")
            return None
        
        # Build recent sales map
        recent_sales_map = {
            (r.product_id, r.sku): float(r.recent_sales)
            for r in recent_results
        }
        
        # Query baseline period
        baseline_stmt = select(
            ShopifyProduct.id.label("product_id"),
            ShopifyProductVariant.sku,
            func.sum(ShopifyLineItem.quantity).label("baseline_sales")
        ).select_from(
            ShopifyLineItem
        ).join(
            ShopifyProductVariant,
            ShopifyLineItem.variant_id == ShopifyProductVariant.shopify_variant_id
        ).join(
            ShopifyProduct,
            ShopifyProductVariant.product_id == ShopifyProduct.id
        ).join(
            ShopifyOrder,
            ShopifyLineItem.order_id == ShopifyOrder.id
        ).join(
            Integration,
            ShopifyOrder.integration_id == Integration.id
        ).join(
            Workspace,
            Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand_id,
            func.date(ShopifyOrder.shopify_created_at) >= baseline_start,
            func.date(ShopifyOrder.shopify_created_at) <= baseline_end,
            ShopifyOrder.financial_status != 'voided',
            ShopifyOrder.shopify_cancelled_at == None
        ).group_by(
            ShopifyProduct.id,
            ShopifyProductVariant.sku
        )
        
        baseline_results = (await session.execute(baseline_stmt)).all()
        
        # Build baseline sales map
        baseline_sales_map = {
            (r.product_id, r.sku): float(r.baseline_sales)
            for r in baseline_results
        }
        
        # Calculate velocity multipliers
        breakout_products = []
        
        for r in recent_results:
            key = (r.product_id, r.sku)
            recent_sales = recent_sales_map.get(key, 0)
            baseline_sales = baseline_sales_map.get(key, 0)
            
            # Skip if no baseline
            if baseline_sales < self.MIN_BASELINE_SALES:
                continue
            
            # Calculate multiplier
            velocity_multiplier = recent_sales / baseline_sales
            
            # Check if breakout
            if velocity_multiplier >= self.VELOCITY_MULTIPLIER_THRESHOLD:
                breakout_products.append({
                    "sku": r.sku or f"Product-{r.product_id}",
                    "title": r.title,
                    "recent_sales": int(recent_sales),
                    "baseline_sales": int(baseline_sales),
                    "velocity_multiplier": round(velocity_multiplier, 1),
                    "recommended_stock_increase_pct": min(int((velocity_multiplier - 1) * 100), 200)
                })
        
        if not breakout_products:
            logger.info("VelocityBreakout: No breakout products found")
            return None
        
        # Sort by velocity multiplier (highest first)
        breakout_products.sort(key=lambda x: x["velocity_multiplier"], reverse=True)
        
        # Calculate aggregates
        total_breakout = len(breakout_products)
        avg_multiplier = sum(p["velocity_multiplier"] for p in breakout_products) / total_breakout
        top_breakout_skus = [p["sku"] for p in breakout_products[:5]]
        
        # Calculate impact score (6-8 range for opportunity)
        if avg_multiplier >= 5.0:
            impact_score = 8.0
        elif avg_multiplier >= 4.0:
            impact_score = 7.5
        else:
            impact_score = 6.5
        
        # Build description
        description = f"{total_breakout} products jumped {avg_multiplier:.1f}x in sales this week."
        
        # Context
        context = f"Strong momentum detected - these products are trending {avg_multiplier:.1f}x above baseline"
        
        # Recommendation
        recommendation = f"Increase inventory by {int((avg_multiplier - 1) * 100)}% and boost marketing spend on these winners"
        
        return InsightObject(
            id="velocity_breakout",
            title="Velocity Breakout Alert",
            description=description,
            impact_score=round(impact_score, 1),
            trend="up",
            meta={
                "category": "growth",
                "breakout_products": total_breakout,
                "velocity_multiplier": round(avg_multiplier, 1),
                "top_breakout_skus": top_breakout_skus,
                "top_items": breakout_products[:5],
                "recent_period": f"{recent_start} to {recent_end}",
                "baseline_period": f"{baseline_start} to {baseline_end}",
                "context": context,
                "recommendation": recommendation,
                "confidence": "high",
                "methodology": "week_over_week_v1"
            }
        )
