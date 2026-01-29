"""
Slow Mover Generator: Detects products with high inventory but low sales velocity.

Signal: Inventory > 0 AND Sales Velocity < 20% of Category Average
Impact: Medium-High (6-8) - Capital efficiency risk
Category: Financial
"""

from datetime import datetime, timedelta
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

class SlowMoverGenerator(BaseInsightGenerator):
    """
    Detects products that are selling too slowly relative to their inventory levels and category peers.
    
    Logic:
    1. Calculate sales velocity (units/day) for last 30 days for all products.
    2. Calculate average velocity per category (product_type).
    3. Identify products with:
       - Inventory depth > 30 days (at current velocity)
       - Velocity < 20% of category average
       - Inventory value > $500 (to avoid noise)
    """
    
    MIN_INVENTORY_VALUE = 500.0
    VELOCITY_DAYS = 30
    
    async def run(self, session: AsyncSession, brand_id: UUID) -> Optional[InsightObject]:
        """
        Generate slow mover insight.
        """
        logger.debug(f"SlowMover: Starting analysis for brand_id={brand_id}")
        
        # 1. Get Sales Velocity per Variant for last 30 days
        cutoff_date = datetime.utcnow() - timedelta(days=self.VELOCITY_DAYS)
        
        # This query gets units sold per variant in last 30 days
        velocity_stmt = select(
            ShopifyLineItem.shopify_variant_id,
            func.sum(ShopifyLineItem.quantity).label("units_sold")
        ).join(
            ShopifyOrder,
            ShopifyLineItem.shopify_order_id == ShopifyOrder.shopify_order_id
        ).join(
            Integration,
            ShopifyOrder.integration_id == Integration.id
        ).join(
            Workspace,
            Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand_id,
            ShopifyOrder.created_at >= cutoff_date,
            ShopifyOrder.financial_status != 'voided',
            ShopifyOrder.shopify_cancelled_at == None
        ).group_by(
            ShopifyLineItem.shopify_variant_id
        )
        
        velocity_results = (await session.execute(velocity_stmt)).all()
        # Map variant_id -> units_sold
        sales_map = {row.shopify_variant_id: float(row.units_sold) for row in velocity_results}
        
        # 2. Get Inventory & Product Details
        # We need Cost, Price, Title, Type, and Available Quantity
        inventory_stmt = select(
            ShopifyProduct.id,
            ShopifyProduct.title,
            ShopifyProduct.product_type,
            ShopifyProductVariant.shopify_variant_id,
            ShopifyProductVariant.title.label("variant_title"),
            ShopifyProductVariant.sku,
            ShopifyProductVariant.price,
            ShopifyInventoryItem.cost,
            ShopifyInventoryLevel.available
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
        ).where(
            Workspace.brand_id == brand_id,
            ShopifyInventoryLevel.available > 0,
            ShopifyProduct.status == 'active'
        )
        
        inventory_results = (await session.execute(inventory_stmt)).all()
        
        if not inventory_results:
            return None
            
        # 3. Process Data
        category_stats = {} # type -> {total_velocity: 0, count: 0}
        product_metrics = []
        
        for row in inventory_results:
            variant_id = row.shopify_variant_id
            units_sold_30d = sales_map.get(variant_id, 0.0)
            daily_velocity = units_sold_30d / self.VELOCITY_DAYS
            
            # Category Stats Accumulation
            p_type = row.product_type or "Uncategorized"
            if p_type not in category_stats:
                category_stats[p_type] = {"total_velocity": 0.0, "count": 0}
            category_stats[p_type]["total_velocity"] += daily_velocity
            category_stats[p_type]["count"] += 1
            
            product_metrics.append({
                "row": row,
                "velocity": daily_velocity,
                "type": p_type
            })
            
        # Calculate Category Averages
        category_averages = {}
        for p_type, stats in category_stats.items():
            if stats["count"] > 0:
                category_averages[p_type] = stats["total_velocity"] / stats["count"]
            else:
                category_averages[p_type] = 0.0

        # 4. Identify Slow Movers
        slow_movers = []
        total_trapped_capital = 0.0
        
        for item in product_metrics:
            row = item["row"]
            velocity = item["velocity"]
            p_type = item["type"]
            
            avg_cat_velocity = category_averages.get(p_type, 0.0)
            
            # Rules:
            # 1. Velocity < 20% of category average OR Velocity == 0 (if valid category avg exists)
            # 2. Inventory Value > Threshold
            cost = float(row.cost or 0)
            available = float(row.available)
            inventory_value = cost * available
            
            if inventory_value < self.MIN_INVENTORY_VALUE:
                continue
                
            is_slow = False
            if avg_cat_velocity > 0.1: # Only check if category moves somewhat
                if velocity < (avg_cat_velocity * 0.2):
                    is_slow = True
            elif velocity == 0 and available > 10: # If category is dead, but we have stock
                 is_slow = True
                 
            if is_slow:
                # Calculate Days Coverage
                # If velocity is 0, coverage is infinite (use 999)
                days_cover = (available / velocity) if velocity > 0 else 9999
                
                # Only flag if we have TOO MUCH stock (> 60 days worth)
                if days_cover > 90: # Increased threshold to 90 days for "Scary" insights
                    years_to_sell = days_cover / 365.0
                    
                    slow_movers.append({
                        "title": f"{row.title} - {row.variant_title}",
                        "sku": row.sku,
                        "value": inventory_value,
                        "days_cover": int(days_cover),
                        "years_to_sell": round(years_to_sell, 1),
                        "velocity": round(velocity, 2),
                        "cat_avg": round(avg_cat_velocity, 2)
                    })
                    total_trapped_capital += inventory_value

        if not slow_movers:
            return None
            
        # Sort by value
        slow_movers.sort(key=lambda x: x["value"], reverse=True)
        top_slow_movers = slow_movers[:5]
        worst_offender = top_slow_movers[0]
        
        # 5. Construct Insight
        count = len(slow_movers)
        impact_score = min(9.5, 6.0 + (total_trapped_capital / 10000.0))
        
        # SCARY SPECIFIC DESCRIPTION
        if worst_offender['years_to_sell'] > 1.0:
            description = f"At current pace, it will take {worst_offender['years_to_sell']} years to sell out of '{worst_offender['title']}'."
        else:
             description = f"You have ${total_trapped_capital:,.0f} stuck in {count} slow-moving products (Sales velocity < 20% of category avg)."
        
        recommendation = "Bundle these items with best-sellers or launch a 'Hidden Gems' email campaign."
        if total_trapped_capital > 50000:
            recommendation = "Consider a flash sale to liquidate this capital for reinvestment."
            
        return InsightObject(
            id="slow_movers",
            title="Dead Stock Alert", # More alarming title
            description=description,
            impact_score=round(impact_score, 1),
            trend="down",
            meta={
                "category": "financial",
                "trapped_capital": round(total_trapped_capital, 2),
                "item_count": count,
                "top_items": top_slow_movers,
                "context": f"You are holding {count} items that have almost zero movement.",
                "recommendation": recommendation,
                "confidence": "high",
                "worst_offender_years": worst_offender['years_to_sell']
            }
        )
