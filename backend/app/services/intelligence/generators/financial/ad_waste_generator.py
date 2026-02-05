"""
Ad Waste Generator: Detects high ad spend on low-converting products.

Signal: High ad spend with low ROI (ROAS < 2.0) OR High Traffic with Low Conversion (CVR < 0.5%)
Impact: Medium-High (6-9)
Category: Financial
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Workspace
from app.models.integration import Integration
from app.models.shopify.metrics import ShopifyDailyMetric
from app.services.intelligence.base_generator import BaseInsightGenerator, InsightObject


class AdWasteGenerator(BaseInsightGenerator):
    """
    Detects potential ad waste.
    
    Logic:
    1. Primary: Check for Marketing Integration data (Stub for now).
    2. Fallback: Check for "High Traffic, Low Conversion" products using Shopify metadata if available.
       - If 'sessions' or 'views' data exists in product metadata.
    3. Fallback 2: Check global store conversion rate dips significantly below baseline.
    """
    
    async def run(self, session: AsyncSession, brand_id: UUID) -> Optional[InsightObject]:
        """
        Generate ad waste insight.
        """
        # TODO: Check for Google/FB Ads integration
        # For now, we assume no direct ad spend data is available.
        
        # 2. Fallback: Analyze Store-Level Conversion Rate Dips
        # If we are driving traffic (Ads) but CVR is dropping, that's potential waste.
        
        cutoff_date = datetime.utcnow().date() - timedelta(days=7)
        
        stmt = select(ShopifyDailyMetric).join(
            Integration,
            ShopifyDailyMetric.integration_id == Integration.id
        ).join(
            Workspace,
            Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand_id,
            ShopifyDailyMetric.snapshot_date >= cutoff_date
        ).order_by(ShopifyDailyMetric.snapshot_date.asc())
        
        metrics = (await session.execute(stmt)).scalars().all()
        
        if not metrics or len(metrics) < 7:
             return None
             
        # Detect anomaly: High Order Count variance or low CVR?
        # Without "sessions" field in ShopifyDailyMetric, we can't calculate CVR accurately.
        # However, checking `meta_data` for 'sessions' if we synced it (e.g. from Shopify Analytics API).
        
        # Checking for "Zero Conversion Days" where sales > 0 (wait, sales implies conversion).
        # Let's check for High Refunds trend which might indicate bad ad traffic (expectations mismatch).
        
        total_sales_7d = sum(float(m.total_sales) for m in metrics)
        total_refunds_7d = sum(float(m.total_refunds) for m in metrics)
        
        if total_sales_7d > 0:
            refund_rate = (total_refunds_7d / total_sales_7d) * 100
            
            # If Refund Rate > 15% (Aggressive Ad Traffic often has high returns)
            if refund_rate > 15.0 and total_sales_7d > 1000:
                impact_score = min(9.0, 5.0 + (refund_rate - 15.0) / 2.0)
                
                return InsightObject(
                    id="ad_waste_proxy_returns",
                    title="Potential Ad Waste (High Returns)",
                    description=f"Refund rate is {refund_rate:.1f}% over the last 7 days. High returns often indicate poor ad targeting quality.",
                    impact_score=round(impact_score, 1),
                    trend="up", # Bad trend
                    meta={
                        "category": "financial",
                        "refund_rate": round(refund_rate, 2),
                        "total_refunds": round(total_refunds_7d, 2),
                        "context": "High return rates suggest paid traffic is landing on mismatched product expectations.",
                        "recommendation": "Review ad creatives and landing page copy alignment.",
                        "confidence": "medium"
                    }
                )
        
        # 3. Fallback 2: ROI Analysis (Gross Profit / Inventory Value)
        # Identify if we are carrying expensive inventory that isn't generating Gross Profit.
        # This is strictly "Capital Efficiency" but fits under "Financial Waste"
        
        # (Simplified check for now since we don't have per-variant profit in daily metrics)
        # We rely on "Gross Sales" - "Cost" proxy if possible, but metrics are aggregated.
        
        # Let's check Global Margin. If Margin < 40% and Sales Velocity is flat.
        
        gross_sales = sum(float(m.gross_sales) for m in metrics)
        
        # We assume Cost is roughly tracked. If not, we can't do this.
        # Let's pivot to "Zero Sales Days" for expensive brands.
        
        zero_sales_days = sum(1 for m in metrics if float(m.total_sales) == 0)
        
        if zero_sales_days >= 3:
             return InsightObject(
                id="revenue_stall",
                title="Revenue Stall Alert",
                description=f"Store has had {zero_sales_days} days with ZERO sales this week.",
                impact_score=8.0,
                trend="down",
                meta={
                    "category": "financial",
                    "zero_days": zero_sales_days,
                    "context": "Consistency is key. Zero sales days indicate traffic issues.",
                    "recommendation": "Check if ads are turned off or if payment gateway is down.",
                    "confidence": "high"
                }
             )

        return None
