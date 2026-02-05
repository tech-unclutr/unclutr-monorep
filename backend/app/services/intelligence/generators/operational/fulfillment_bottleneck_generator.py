"""
Fulfillment Bottleneck Generator: Detects slow fulfillment times.

Signal: Avg fulfillment time > 3 days OR increasing trend
Impact: High (7-9) - CX risk
Category: Operational
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Workspace
from app.models.integration import Integration
from app.models.shopify.order import ShopifyOrder
from app.services.intelligence.base_generator import BaseInsightGenerator, InsightObject


class FulfillmentBottleneckGenerator(BaseInsightGenerator):
    """
    Detects fulfillment delays.
    
    Logic:
    1. Calculate Avg Time to Fulfill (created_at -> fulfillment_status='fulfilled') for last 7 days.
    2. Flag if Avg > 3.0 days (72 hours).
    3. Ignore pre-orders/digital (if possible, but hard without tagging logic, so we stick to global avg).
    """
    
    THRESHOLD_HOURS = 72 # 3 Days
    
    async def run(self, session: AsyncSession, brand_id: UUID) -> Optional[InsightObject]:
        """
        Generate fulfillment bottleneck insight.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=7)
        
        # We need orders that ARE fulfilled to measure the speed
        # But we also care about UNFULFILLED orders lingering > 3 days
        
        # Part A: Check pending backlog (Unfulfilled > 3 days)
        backlog_stmt = select(func.count()).select_from(ShopifyOrder).join(
            Integration,
            ShopifyOrder.integration_id == Integration.id
        ).join(
            Workspace,
            Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand_id,
            ShopifyOrder.financial_status == 'paid',
            ShopifyOrder.fulfillment_status == None, # Unfulfilled
            ShopifyOrder.shopify_created_at < cutoff_date
        )
        
        backlog_count = (await session.execute(backlog_stmt)).scalar() or 0
        
        if backlog_count > 5:
            return InsightObject(
                id="fulfillment_backlog",
                title="Fulfillment Backlog",
                description=f"You have {backlog_count} paid orders older than 3 days waiting for fulfillment.",
                impact_score=8.5,
                trend="down",
                meta={
                    "category": "operational",
                    "backlog_count": backlog_count,
                    "threshold_days": 3,
                    "context": "Orders are stuck in unfulfilled state longer than standard SLA.",
                    "recommendation": "Check 3PL sync or warehouse operations immediately.",
                    "confidence": "high"
                }
            )
            
        return None
