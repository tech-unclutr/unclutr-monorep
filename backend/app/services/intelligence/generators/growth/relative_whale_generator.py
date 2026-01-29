"""
Relative Whale Generator: Identifies customers in top 1% LTV.

Signal: Top 1% customers by lifetime value
Impact: Medium-High (7-9) - retention focus
Category: Growth
"""

from typing import Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.services.intelligence.base_generator import BaseInsightGenerator, InsightObject
from app.models.shopify.customer import ShopifyCustomer
from app.models.shopify.order import ShopifyOrder
from app.models.integration import Integration
from app.models.company import Workspace


class RelativeWhaleGenerator(BaseInsightGenerator):
    """
    Identifies top 1% customers by LTV.
    
    Provides whale customer insights for VIP programs.
    """
    
    PERCENTILE_THRESHOLD = 0.99  # Top 1%
    
    async def run(self, session: AsyncSession, brand_id: UUID) -> Optional[InsightObject]:
        """
        Generate relative whale insight.
        """
        logger.debug(f"RelativeWhale: Starting analysis for brand_id={brand_id}")
        
        # Calculate LTV for all customers
        ltv_stmt = select(
            ShopifyCustomer.id,
            ShopifyCustomer.email,
            func.sum(ShopifyOrder.total_price).label("ltv")
        ).select_from(
            ShopifyCustomer
        ).join(
            ShopifyOrder,
            ShopifyCustomer.id == ShopifyOrder.customer_id
        ).join(
            Integration,
            ShopifyOrder.integration_id == Integration.id
        ).join(
            Workspace,
            Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand_id,
            ShopifyOrder.financial_status != 'voided'
        ).group_by(
            ShopifyCustomer.id,
            ShopifyCustomer.email
        )
        
        ltv_results = (await session.execute(ltv_stmt)).all()
        
        if len(ltv_results) < 100:
            logger.info("RelativeWhale: Insufficient customer base (<100)")
            return None
        
        # Calculate 99th percentile
        ltvs = sorted([float(r.ltv) for r in ltv_results], reverse=True)
        percentile_index = int(len(ltvs) * (1 - self.PERCENTILE_THRESHOLD))
        whale_threshold = ltvs[percentile_index]
        
        # Get whales
        whales = [r for r in ltv_results if float(r.ltv) >= whale_threshold]
        
        # Calculate metrics
        whale_count = len(whales)
        avg_whale_ltv = sum(float(w.ltv) for w in whales) / whale_count
        total_revenue = sum(float(r.ltv) for r in ltv_results)
        whale_revenue = sum(float(w.ltv) for w in whales)
        whale_contribution_pct = (whale_revenue / total_revenue) * 100
        
        # Impact score
        impact_score = 7.0 + min(whale_contribution_pct / 10, 2.0)
        
        description = f"{whale_count} customers contribute {whale_contribution_pct:.0f}% of total revenue."
        
        return InsightObject(
            id="relative_whale",
            title="VIP Customer Concentration",
            description=description,
            impact_score=round(impact_score, 1),
            trend="neutral",
            meta={
                "category": "growth",
                "whale_count": whale_count,
                "avg_whale_ltv": round(avg_whale_ltv, 2),
                "whale_contribution_pct": round(whale_contribution_pct, 1),
                "whale_threshold": round(whale_threshold, 2),
                "context": f"Top {whale_count} customers are driving {whale_contribution_pct:.0f}% of revenue",
                "recommendation": "Build VIP loyalty program to retain these high-value customers",
                "confidence": "high",
                "methodology": "percentile_v1"
            }
        )
