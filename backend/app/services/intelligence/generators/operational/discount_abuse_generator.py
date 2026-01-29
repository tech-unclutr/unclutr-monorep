"""
Discount Abuse Generator: Detects potential coupon abuse.

Signal: Single customer using discounts > 5 times OR > 20% of revenue is discounted
Impact: Medium (5-7) - Margin erosion
Category: Operational
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.services.intelligence.base_generator import BaseInsightGenerator, InsightObject
from app.models.shopify.order import ShopifyOrder
from app.models.integration import Integration
from app.models.company import Workspace

class DiscountAbuseGenerator(BaseInsightGenerator):
    """
    Detects potential discount abuse.
    
    Logic:
    1. Analyze last 30 days.
    2. Calculate Total Discount / Total Revenue ratio.
    3. Flag if Ratio > 20% (Margin Erosion Warning).
    """
    
    async def run(self, session: AsyncSession, brand_id: UUID) -> Optional[InsightObject]:
        """
        Generate discount abuse insight.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        
        stmt = select(
             func.sum(ShopifyOrder.total_price),
             func.sum(ShopifyOrder.total_discounts)
        ).join(
            Integration,
            ShopifyOrder.integration_id == Integration.id
        ).join(
            Workspace,
            Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand_id,
            ShopifyOrder.shopify_created_at >= cutoff_date,
            ShopifyOrder.financial_status != 'voided',
            ShopifyOrder.shopify_cancelled_at == None
        )
        
        row = (await session.execute(stmt)).first()
        
        if not row:
            return None
            
        total_sales = float(row[0] or 0)
        total_discounts = float(row[1] or 0)
        
        if total_sales < 1000: # Ignore low volume
            return None
            
        discount_rate = (total_discounts / total_sales) * 100
        
        if discount_rate > 20.0:
            impact_score = min(8.0, 5.0 + (discount_rate - 20.0) / 2.0)
            
            return InsightObject(
                id="discount_erosion",
                title="Margin Erosion Alert",
                description=f"Discounts accounted for {discount_rate:.1f}% of revenue in the last 30 days (High).",
                impact_score=round(impact_score, 1),
                trend="down",
                meta={
                    "category": "operational",
                    "discount_rate": round(discount_rate, 2),
                    "total_discounts": round(total_discounts, 2),
                    "context": "High discount rates erode profit margins significantly.",
                    "recommendation": "Audit active coupon codes and reduce site-wide sales frequency.",
                    "confidence": "high"
                }
            )
            
        return None
