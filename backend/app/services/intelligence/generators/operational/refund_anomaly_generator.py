"""
Refund Anomaly Generator: Detects spikes in refund requests.

Signal: Refund spike > 50% week-over-week
Impact: Critical (8-10) - fraud or quality crisis
Category: Operational
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.services.intelligence.base_generator import BaseInsightGenerator, InsightObject
from app.models.shopify.refund import ShopifyRefund
from app.models.integration import Integration
from app.models.company import Workspace


class RefundAnomalyGenerator(BaseInsightGenerator):
    """
    Detects sudden spikes in refund activity.
    
    Indicates potential fraud or quality crisis.
    """
    
    SPIKE_THRESHOLD = 1.5  # 50% increase
    
    async def run(self, session: AsyncSession, brand_id: UUID) -> Optional[InsightObject]:
        """
        Generate refund anomaly insight.
        """
        logger.debug(f"RefundAnomaly: Starting analysis for brand_id={brand_id}")
        
        # Calculate refunds this week vs last week
        today = datetime.utcnow()
        this_week_start = today - timedelta(days=7)
        last_week_start = today - timedelta(days=14)
        last_week_end = this_week_start
        
        # This week refunds
        this_week_stmt = select(
            func.count(ShopifyRefund.id).label("refund_count")
        ).select_from(
            ShopifyRefund
        ).join(
            Integration,
            ShopifyRefund.integration_id == Integration.id
        ).join(
            Workspace,
            Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand_id,
            ShopifyRefund.processed_at >= this_week_start
        )
        
        this_week_result = (await session.execute(this_week_stmt)).first()
        
        # Last week refunds
        last_week_stmt = select(
            func.count(ShopifyRefund.id).label("refund_count")
        ).select_from(
            ShopifyRefund
        ).join(
            Integration,
            ShopifyRefund.integration_id == Integration.id
        ).join(
            Workspace,
            Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand_id,
            ShopifyRefund.processed_at >= last_week_start,
            ShopifyRefund.processed_at < last_week_end
        )
        
        last_week_result = (await session.execute(last_week_stmt)).first()
        
        # Calculate spike
        this_week_count = this_week_result.refund_count or 0
        last_week_count = last_week_result.refund_count or 0
        
        if last_week_count == 0:
            logger.info("RefundAnomaly: No baseline data")
            return None
        
        spike_ratio = this_week_count / last_week_count
        
        if spike_ratio < self.SPIKE_THRESHOLD:
            logger.info(f"RefundAnomaly: No spike detected ({spike_ratio:.1f}x)")
            return None
        
        # Calculate metrics
        spike_pct = ((spike_ratio - 1) * 100)
        
        # Impact score (8-10 for critical)
        if spike_ratio >= 3.0:
            impact_score = 10.0
        elif spike_ratio >= 2.0:
            impact_score = 9.0
        else:
            impact_score = 8.0
        
        # Build description
        description = f"Refund requests spiked {spike_pct:.0f}% this week ({this_week_count} requests)."
        
        # Context
        context = f"Refund volume jumped from {last_week_count} to {this_week_count} requests"
        
        # Recommendation
        recommendation = "Investigate immediately - potential fraud or quality crisis"
        
        return InsightObject(
            id="refund_anomaly",
            title="Refund Spike Alert",
            description=description,
            impact_score=round(impact_score, 1),
            trend="up",
            meta={
                "category": "operational",
                "refund_spike_pct": round(spike_pct, 1),
                "this_week_count": this_week_count,
                "last_week_count": last_week_count,
                "spike_ratio": round(spike_ratio, 2),
                "context": context,
                "recommendation": recommendation,
                "confidence": "high",
                "methodology": "week_over_week_v1"
            }
        )
