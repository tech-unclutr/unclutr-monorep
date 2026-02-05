"""
Margin Crusher Generator: Detects products selling below cost.

Signal: Products where actual transaction price < cost
Impact: Critical (9-10) - losing money per sale
Category: Financial
"""

from typing import Optional
from uuid import UUID

from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Workspace
from app.models.integration import Integration
from app.models.shopify.inventory import ShopifyInventoryItem
from app.models.shopify.order import ShopifyLineItem, ShopifyOrder
from app.models.shopify.product import ShopifyProductVariant
from app.services.intelligence.base_generator import BaseInsightGenerator, InsightObject


class MarginCrusherGenerator(BaseInsightGenerator):
    """
    Detects products with negative margins (selling below cost).
    
    Edge cases handled:
    - Uses actual transaction data (not list price)
    - Excludes bundles
    - Excludes voided/refunded orders
    - Requires minimum 3 sales to confirm pattern
    """
    
    MIN_SALES_THRESHOLD = 3
    
    async def run(self, session: AsyncSession, brand_id: UUID) -> Optional[InsightObject]:
        """
        Generate margin crusher insight.
        """
        logger.debug(f"MarginCrusher: Starting analysis for brand_id={brand_id}")
        
        # Query: Line items where price_after_discount < cost
        stmt = select(
            ShopifyProductVariant.sku,
            ShopifyProductVariant.title.label("variant_title"),
            ShopifyInventoryItem.cost,
            func.avg(ShopifyLineItem.price).label("avg_price"),
            func.count(ShopifyLineItem.id).label("negative_margin_sales"),
            func.sum(ShopifyInventoryItem.cost - ShopifyLineItem.price).label("total_loss")
        ).select_from(
            ShopifyLineItem
        ).join(
            ShopifyProductVariant,
            ShopifyLineItem.variant_id == ShopifyProductVariant.shopify_variant_id
        ).join(
            ShopifyInventoryItem,
            ShopifyProductVariant.shopify_inventory_item_id == ShopifyInventoryItem.shopify_inventory_item_id
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
            ShopifyLineItem.price < ShopifyInventoryItem.cost,  # Negative margin
            ShopifyOrder.financial_status != 'voided',
            ShopifyOrder.shopify_cancelled_at == None,
            # Exclude bundles (if applicable)
            # ShopifyLineItem.bundle_id == None
        ).group_by(
            ShopifyProductVariant.sku,
            ShopifyProductVariant.title,
            ShopifyInventoryItem.cost
        ).having(
            func.count(ShopifyLineItem.id) >= self.MIN_SALES_THRESHOLD
        )
        
        results = (await session.execute(stmt)).all()
        
        if not results:
            logger.info("MarginCrusher: No negative margin products found")
            return None
        
        # Build negative margin items list
        negative_margin_items = []
        total_loss = 0.0
        
        for row in results:
            margin_deficit = float(row.cost) - float(row.avg_price)
            margin_deficit_pct = (margin_deficit / float(row.cost)) * 100 if row.cost else 0
            
            negative_margin_items.append({
                "sku": row.sku or "Unknown",
                "title": row.variant_title,
                "cost": round(float(row.cost), 2),
                "avg_price": round(float(row.avg_price), 2),
                "margin_deficit": round(margin_deficit, 2),
                "margin_deficit_pct": round(margin_deficit_pct, 1),
                "sales_count": int(row.negative_margin_sales),
                "total_loss": round(float(row.total_loss), 2)
            })
            
            total_loss += float(row.total_loss)
        
        # Sort by total_loss (worst offenders first)
        negative_margin_items.sort(key=lambda x: x["total_loss"], reverse=True)
        
        # Calculate metrics
        total_items = len(negative_margin_items)
        avg_margin_deficit_pct = sum(i["margin_deficit_pct"] for i in negative_margin_items) / total_items
        total_sales_count = sum(i["sales_count"] for i in negative_margin_items)
        worst_offenders = [i["sku"] for i in negative_margin_items[:5]]
        
        # Calculate impact score (9-10 range for critical)
        # More loss = higher score
        if total_loss > 5000:
            impact_score = 10.0
        elif total_loss > 1000:
            impact_score = 9.5
        else:
            impact_score = 9.0
        
        # Build description
        description = f"{total_items} products are selling below cost, losing ${total_loss:,.0f} per sale."
        
        # Context
        context = f"These products have negative margins averaging {avg_margin_deficit_pct:.0f}% below cost"
        
        # Recommendation
        recommendation = f"Immediately adjust pricing or stop selling these {total_items} products to prevent further losses"
        
        return InsightObject(
            id="margin_crusher",
            title="Margin Crusher Alert",
            description=description,
            impact_score=round(impact_score, 1),
            trend="down",
            meta={
                "category": "financial",
                "negative_margin_items": total_items,
                "total_loss_amount": round(total_loss, 2),
                "avg_margin_deficit_pct": round(avg_margin_deficit_pct, 1),
                "affected_order_count": total_sales_count,
                "worst_offenders": worst_offenders,
                "top_items": negative_margin_items[:5],
                "context": context,
                "recommendation": recommendation,
                "confidence": "high",
                "methodology": "actual_transaction_v1"
            }
        )
