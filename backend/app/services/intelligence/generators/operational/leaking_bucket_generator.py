"""
Leaking Bucket Generator: Detects products with high return rates.

Signal: Return rate > 2 standard deviations above mean
Impact: High (7-9) - quality/brand risk
Category: Operational
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.services.intelligence.base_generator import BaseInsightGenerator, InsightObject
from app.models.shopify.product import ShopifyProduct, ShopifyProductVariant
from app.models.shopify.order import ShopifyOrder, ShopifyLineItem
from app.models.shopify.refund import ShopifyRefund
from app.models.integration import Integration
from app.models.company import Workspace


class LeakingBucketGenerator(BaseInsightGenerator):
    """
    Detects products with abnormally high return rates.
    
    Edge cases handled:
    - Requires minimum sample size (10+ orders)
    - Statistical significance (2σ above mean)
    - Excludes voided orders
    """
    
    MIN_ORDER_COUNT = 10
    SIGMA_THRESHOLD = 2.0
    
    async def run(self, session: AsyncSession, brand_id: UUID) -> Optional[InsightObject]:
        """
        Generate leaking bucket insight.
        """
        logger.debug(f"LeakingBucket: Starting analysis for brand_id={brand_id}")
        
        # Calculate return rate per product
        # Return rate = (refunded orders / total orders) * 100
        
        stmt = select(
            ShopifyProduct.id.label("product_id"),
            ShopifyProduct.title,
            ShopifyProductVariant.sku,
            func.count(func.distinct(ShopifyOrder.id)).label("total_orders"),
            func.count(func.distinct(ShopifyRefund.shopify_order_id)).label("refunded_orders")
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
        ).outerjoin(
            ShopifyRefund,
            ShopifyOrder.id == ShopifyRefund.order_id
        ).join(
            Integration,
            ShopifyOrder.integration_id == Integration.id
        ).join(
            Workspace,
            Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand_id,
            ShopifyOrder.financial_status != 'voided',
            ShopifyOrder.shopify_cancelled_at == None
        ).group_by(
            ShopifyProduct.id,
            ShopifyProduct.title,
            ShopifyProductVariant.sku
        ).having(
            func.count(func.distinct(ShopifyOrder.id)) >= self.MIN_ORDER_COUNT
        )
        
        results = (await session.execute(stmt)).all()
        
        if not results:
            logger.info("LeakingBucket: Insufficient order data")
            return None
        
        # Calculate return rates
        return_rates = []
        product_data = []
        
        for r in results:
            return_rate = (float(r.refunded_orders) / float(r.total_orders)) * 100 if r.total_orders > 0 else 0
            return_rates.append(return_rate)
            product_data.append({
                "product_id": r.product_id,
                "title": r.title,
                "sku": r.sku,
                "return_rate": return_rate,
                "total_orders": int(r.total_orders),
                "refunded_orders": int(r.refunded_orders)
            })
        
        # Calculate mean and stddev
        if len(return_rates) < 2:
            logger.info("LeakingBucket: Insufficient products for statistical analysis")
            return None
        
        mean_return_rate = sum(return_rates) / len(return_rates)
        variance = sum((x - mean_return_rate) ** 2 for x in return_rates) / len(return_rates)
        stddev = variance ** 0.5
        
        # Find products > 2σ above mean
        threshold = mean_return_rate + (self.SIGMA_THRESHOLD * stddev)
        
        high_return_products = [
            p for p in product_data
            if p["return_rate"] > threshold
        ]
        
        if not high_return_products:
            logger.info("LeakingBucket: No products with abnormally high returns")
            return None
        
        # Sort by return rate (worst first)
        high_return_products.sort(key=lambda x: x["return_rate"], reverse=True)
        
        # Calculate aggregates
        total_high_return = len(high_return_products)
        avg_return_rate = sum(p["return_rate"] for p in high_return_products) / total_high_return
        high_return_skus = [p["sku"] or f"Product-{p['product_id']}" for p in high_return_products[:5]]
        
        # Calculate quality cost (estimated)
        # Assume average order value of $50 (would query actual in production)
        estimated_quality_cost = sum(p["refunded_orders"] for p in high_return_products) * 50
        
        # Calculate impact score (7-9 range for quality risk)
        if avg_return_rate > 30:
            impact_score = 9.0
        elif avg_return_rate > 20:
            impact_score = 8.0
        else:
            impact_score = 7.0
        
        # Build description
        description = f"{total_high_return} products have return rates {avg_return_rate:.0f}% above average."
        
        # Context
        context = f"These products are {avg_return_rate / mean_return_rate:.1f}x above the {mean_return_rate:.0f}% baseline return rate"
        
        # Recommendation
        recommendation = f"Investigate quality issues immediately - estimated cost: ${estimated_quality_cost:,.0f}"
        
        return InsightObject(
            id="leaking_bucket",
            title="Quality Issue Alert",
            description=description,
            impact_score=round(impact_score, 1),
            trend="down",
            meta={
                "category": "operational",
                "high_return_skus": total_high_return,
                "return_rate_pct": round(avg_return_rate, 1),
                "quality_cost": round(estimated_quality_cost, 2),
                "top_return_skus": high_return_skus,
                "top_items": high_return_products[:5],
                "baseline_return_rate": round(mean_return_rate, 1),
                "threshold_return_rate": round(threshold, 1),
                "context": context,
                "recommendation": recommendation,
                "confidence": "high",
                "methodology": "statistical_outlier_v1"
            }
        )
