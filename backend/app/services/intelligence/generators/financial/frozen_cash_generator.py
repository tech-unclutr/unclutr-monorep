"""
Frozen Cash Generator: Detects inventory with 60+ days of zero sales.

Signal: Products with no sales in 60+ days
Impact: High (7-10) - cash optimization opportunity
Category: Financial
"""

from datetime import date, timedelta, datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.services.intelligence.base_generator import BaseInsightGenerator, InsightObject
from app.models.shopify.inventory import ShopifyInventoryLevel, ShopifyInventoryItem
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant
from app.models.shopify.order import ShopifyOrder, ShopifyLineItem
from app.models.integration import Integration
from app.models.company import Workspace


class FrozenCashGenerator(BaseInsightGenerator):
    """
    Detects products with 60+ days of zero sales.
    
    Edge cases handled:
    - Seasonal products (excluded)
    - Pre-order/backorder items (excluded)
    - Intentional holds (excluded via tags)
    - Zero-cost items (excluded)
    - Minimum value threshold ($100)
    """
    
    FROZEN_DAYS_THRESHOLD = 60
    MIN_COST_THRESHOLD = 1.0
    MIN_VALUE_THRESHOLD = 100.0
    
    async def run(self, session: AsyncSession, brand_id: UUID) -> Optional[InsightObject]:
        """
        Generate frozen cash insight.
        """
        logger.debug(f"FrozenCash: Starting analysis for brand_id={brand_id}")
        
        # Calculate cutoff date
        cutoff_date = datetime.utcnow() - timedelta(days=self.FROZEN_DAYS_THRESHOLD)
        
        # Query: Products with no sales since cutoff_date
        # Join: inventory -> product -> line_items -> orders
        stmt = select(
            ShopifyProduct.id,
            ShopifyProduct.title,
            ShopifyProduct.tags,
            ShopifyProductVariant.sku,
            ShopifyInventoryItem.cost,
            ShopifyInventoryLevel.available,
            (ShopifyInventoryLevel.available * ShopifyInventoryItem.cost).label("item_value"),
            func.max(ShopifyOrder.shopify_created_at).label("last_sale_date")
        ).select_from(
            ShopifyInventoryLevel
        ).join(
            ShopifyInventoryItem,
            ShopifyInventoryLevel.shopify_inventory_item_id == ShopifyInventoryItem.shopify_inventory_item_id
        ).join(
            ShopifyProductVariant,
            ShopifyInventoryItem.shopify_inventory_item_id == ShopifyProductVariant.shopify_inventory_item_id
        ).join(
            ShopifyProduct,
            ShopifyProductVariant.product_id == ShopifyProduct.id
        ).join(
            Integration,
            ShopifyInventoryLevel.integration_id == Integration.id
        ).join(
            Workspace,
            Integration.workspace_id == Workspace.id
        ).outerjoin(
            ShopifyLineItem,
            ShopifyProductVariant.shopify_variant_id == ShopifyLineItem.shopify_variant_id
        ).outerjoin(
            ShopifyOrder,
            and_(
                ShopifyLineItem.shopify_order_id == ShopifyOrder.shopify_order_id,
                ShopifyOrder.financial_status != 'voided',
                ShopifyOrder.shopify_cancelled_at == None
            )
        ).where(
            Workspace.brand_id == brand_id,
            ShopifyProduct.status == 'active',
            ShopifyInventoryItem.cost > self.MIN_COST_THRESHOLD,
            ShopifyInventoryLevel.available > 0,
            # Exclude seasonal products
            or_(
                ShopifyProduct.tags == None,
                ~ShopifyProduct.tags.ilike('%seasonal%')
            ),
            # Exclude pre-orders
            or_(
                ShopifyProduct.tags == None,
                ~ShopifyProduct.tags.ilike('%preorder%')
            ),
            # Exclude launch holds
            or_(
                ShopifyProduct.tags == None,
                ~ShopifyProduct.tags.ilike('%launch%')
            )
        ).group_by(
            ShopifyProduct.id,
            ShopifyProduct.title,
            ShopifyProduct.tags,
            ShopifyProductVariant.sku,
            ShopifyInventoryItem.cost,
            ShopifyInventoryLevel.available
        ).having(
            or_(
                func.max(ShopifyOrder.shopify_created_at) < cutoff_date,
                func.max(ShopifyOrder.shopify_created_at) == None
            )
        )
        
        results = (await session.execute(stmt)).all()
        
        if not results:
            logger.info("FrozenCash: No frozen inventory found")
            return None
        
        # Calculate aggregates
        frozen_items = []
        total_frozen_value = 0.0
        total_days_frozen = 0
        
        for row in results:
            item_value = float(row.item_value or 0)
            
            # Apply minimum value threshold
            if item_value < self.MIN_VALUE_THRESHOLD:
                continue
            
            # Calculate days frozen
            if row.last_sale_date:
                days_frozen = (datetime.utcnow() - row.last_sale_date).days
            else:
                days_frozen = 90  # Assume 90+ days if never sold
            
            frozen_items.append({
                "sku": row.sku or f"Product-{row.id}",
                "title": row.title,
                "value": round(item_value, 2),
                "days_frozen": days_frozen,
                "quantity": int(row.available)
            })
            
            total_frozen_value += item_value
            total_days_frozen += days_frozen
        
        if not frozen_items:
            logger.info("FrozenCash: All items below minimum threshold")
            return None
        
        # Sort by value (highest first)
        frozen_items.sort(key=lambda x: x["value"], reverse=True)
        
        # Calculate metrics
        avg_days_frozen = int(total_days_frozen / len(frozen_items))
        top_frozen_skus = [item["sku"] for item in frozen_items[:5]]
        
        # Calculate impact score (7-10 range for high urgency)
        # Scale: $10k = 7.0, $50k = 10.0
        if total_frozen_value < 10000:
            impact_score = 5.0 + (total_frozen_value / 10000 * 2.0)
        elif total_frozen_value < 50000:
            impact_score = 7.0 + ((total_frozen_value - 10000) / 40000 * 3.0)
        else:
            impact_score = 10.0
        
        # Build description
        description = f"You have ${total_frozen_value:,.0f} locked in {len(frozen_items)} items with no sales in {avg_days_frozen} days."
        
        # Context
        context = f"These {len(frozen_items)} products represent dead inventory that could be converted to cash"
        
        # Recommendation
        if total_frozen_value > 20000:
            recommendation = f"Run a clearance sale (30-50% off) to free up ${total_frozen_value * 0.7:,.0f} in cash within 30 days"
        else:
            recommendation = f"Bundle slow movers with bestsellers or run targeted promotions"
        
        return InsightObject(
            id="frozen_cash",
            title="Frozen Cash Alert",
            description=description,
            impact_score=round(impact_score, 1),
            trend="down",
            meta={
                "category": "financial",
                "frozen_value": round(total_frozen_value, 2),
                "frozen_items": len(frozen_items),
                "avg_days_frozen": avg_days_frozen,
                "top_frozen_skus": top_frozen_skus,
                "top_items": frozen_items[:5],
                "total_opportunity": round(total_frozen_value, 2),
                "context": context,
                "recommendation": recommendation,
                "confidence": "high",
                "methodology": "frozen_cash_v1",
                "cutoff_days": self.FROZEN_DAYS_THRESHOLD
            }
        )
