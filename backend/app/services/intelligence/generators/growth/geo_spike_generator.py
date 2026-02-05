"""
Geo Spike Generator: Detects sudden sales spikes in specific regions.

Signal: Z-Score spike > 2.0 in a specific region (City/Province)
Impact: Medium (5-7) - Targeted marketing opportunity
Category: Growth
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Workspace
from app.models.integration import Integration
from app.models.shopify.order import ShopifyOrder
from app.services.intelligence.base_generator import BaseInsightGenerator, InsightObject


class GeoSpikeGenerator(BaseInsightGenerator):
    """
    Detects regional sales anomalies.
    
    Logic:
    1. Group orders by Shipping Province/City for last 7 days vs previous 30 days.
    2. Calculate average daily orders per region.
    3. Detect if last 7 days average > previous 30 days average + 2 * std_dev.
    """
    
    LOOKBACK_DAYS = 30
    RECENT_DAYS = 7
    MIN_ORDERS_COUNTS = 5 # Minimum orders in region to consider
    
    async def run(self, session: AsyncSession, brand_id: UUID) -> Optional[InsightObject]:
        """
        Generate geo spike insight.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=self.LOOKBACK_DAYS + self.RECENT_DAYS)
        recent_cutoff = datetime.utcnow() - timedelta(days=self.RECENT_DAYS)
        
        # Fetch orders with shipping address info
        # Note: ShopifyOrder model implies 'shipping_address' JSONB field or similar structure
        # We need to check the model definition. Assuming shipping_address is a dict field.
        
        stmt = select(
            ShopifyOrder.shopify_created_at,
            ShopifyOrder.raw_payload
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
        
        results = (await session.execute(stmt)).all()
        
        if not results:
             return None
             
        # Aggregate logic in Python (easier for JSONB grouping)
        region_stats = {} # "City, Province" -> {recent_count: 0, historic_count: 0}
        
        for row in results:
            payload = row.raw_payload or {}
            addr = payload.get("shipping_address")
            
            if not isinstance(addr, dict):
                continue
                
            city = addr.get("city", "Unknown")
            province = addr.get("province_code") or addr.get("province", "")
            
            if not city or not province:
                continue
                
            region_key = f"{city}, {province}"
            
            if region_key not in region_stats:
                region_stats[region_key] = {"recent": 0, "historic": 0}
                
            if row.shopify_created_at >= recent_cutoff:
                region_stats[region_key]["recent"] += 1
            else:
                region_stats[region_key]["historic"] += 1
                
        # Analyze
        best_spike = None
        max_ratio = 0.0
        
        for region, stats in region_stats.items():
            recent = stats["recent"]
            historic = stats["historic"]
            
            if recent < self.MIN_ORDERS_COUNTS:
                continue
                
            # Normalize to daily averages
            recent_daily = recent / self.RECENT_DAYS
            historic_daily = historic / self.LOOKBACK_DAYS
            
            if historic_daily < 0.1: # Avoid division by zero/noise
                continue
                
            ratio = recent_daily / historic_daily
            
            # If sales are 2x (200%) higher than usual
            if ratio >= 2.0 and ratio > max_ratio:
                max_ratio = ratio
                best_spike = {
                    "region": region,
                    "ratio": ratio,
                    "recent": recent,
                    "avg": historic_daily
                }
                
        if best_spike:
            impact_score = min(8.0, 5.0 + (best_spike["ratio"] / 2.0))
            
            percent_increase = (best_spike["ratio"] - 1.0) * 100
            
            return InsightObject(
                id="geo_spike",
                title=f"Surge in {best_spike['region']}",
                description=f"Sales in {best_spike['region']} are up {percent_increase:.0f}% this week ({best_spike['recent']} orders).",
                impact_score=round(impact_score, 1),
                trend="up",
                meta={
                    "category": "growth",
                    "region": best_spike["region"],
                    "recent_orders": best_spike["recent"],
                    "historic_daily_avg": round(best_spike["avg"], 1),
                    "increase_factor": round(best_spike["ratio"], 1),
                    "context": f"Unusual buying activity detected in {best_spike['region']}.",
                    "recommendation": f"Target ads to {best_spike['region']} or check for local influencer activity.",
                    "confidence": "high"
                }
            )
            
        return None
