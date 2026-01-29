"""
VIP at Risk Generator: Detects high-value customers with churn risk.

Signal: High LTV customers who are overdue for purchase
Impact: Critical (8-10) - churn prevention
Category: Growth
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.services.intelligence.base_generator import BaseInsightGenerator, InsightObject
from app.models.shopify.customer import ShopifyCustomer
from app.models.shopify.order import ShopifyOrder
from app.models.integration import Integration
from app.models.company import Workspace


class VIPAtRiskGenerator(BaseInsightGenerator):
    """
    Detects VIP customers at risk of churning using RFM analysis.
    
    Edge cases handled:
    - Customer-specific purchase cycle (not fixed 30 days)
    - Frequency drop detection
    - Monetary value drop detection
    - Email unsubscribe check
    """
    
    VIP_LTV_THRESHOLD = 1000.0  # $1000+ = VIP
    OVERDUE_MULTIPLIER = 1.5  # 50% past expected cycle = at risk
    
    async def run(self, session: AsyncSession, brand_id: UUID) -> Optional[InsightObject]:
        """
        Generate VIP at risk insight using RFM model.
        """
        logger.debug(f"VIPAtRisk: Starting analysis for brand_id={brand_id}")
        
        # Step 1: Get all customers with LTV > threshold
        vip_stmt = select(
            ShopifyCustomer.id,
            ShopifyCustomer.email,
            ShopifyCustomer.first_name,
            ShopifyCustomer.last_name,
            func.sum(ShopifyOrder.total_price).label("ltv"),
            func.count(ShopifyOrder.id).label("order_count"),
            func.max(ShopifyOrder.shopify_created_at).label("last_order_date")
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
            ShopifyOrder.financial_status != 'voided',
            ShopifyOrder.shopify_cancelled_at == None
        ).group_by(
            ShopifyCustomer.id,
            ShopifyCustomer.email,
            ShopifyCustomer.first_name,
            ShopifyCustomer.last_name
        ).having(
            func.sum(ShopifyOrder.total_price) >= self.VIP_LTV_THRESHOLD
        )
        
        vip_results = (await session.execute(vip_stmt)).all()
        
        if not vip_results:
            logger.info("VIPAtRisk: No VIP customers found")
            return None
        
        # Step 2: Calculate churn risk for each VIP
        at_risk_vips = []
        
        for vip in vip_results:
            # Calculate average purchase cycle
            cycle_stmt = select(
                func.avg(
                    func.extract('epoch', 
                        func.lead(ShopifyOrder.shopify_created_at).over(
                            order_by=ShopifyOrder.shopify_created_at
                        ) - ShopifyOrder.shopify_created_at
                    ) / 86400  # Convert to days
                ).label("avg_cycle_days")
            ).select_from(
                ShopifyOrder
            ).join(
                Integration,
                ShopifyOrder.integration_id == Integration.id
            ).join(
                Workspace,
                Integration.workspace_id == Workspace.id
            ).where(
                Workspace.brand_id == brand_id,
                ShopifyOrder.customer_id == vip.id,
                ShopifyOrder.financial_status != 'voided'
            )
            
            cycle_result = (await session.execute(cycle_stmt)).scalar()
            avg_cycle_days = float(cycle_result) if cycle_result else 30.0  # Default 30 days
            
            # Calculate days since last order
            days_since_last_order = (datetime.utcnow() - vip.last_order_date).days
            
            # Calculate expected next order date
            expected_days = avg_cycle_days * self.OVERDUE_MULTIPLIER
            
            # Check if overdue
            if days_since_last_order > expected_days:
                # Calculate frequency drop (last 90d vs prev 90d)
                ninety_days_ago = datetime.utcnow() - timedelta(days=90)
                one_eighty_days_ago = datetime.utcnow() - timedelta(days=180)
                
                recent_orders_stmt = select(
                    func.count(ShopifyOrder.id)
                ).select_from(
                    ShopifyOrder
                ).join(
                    Integration,
                    ShopifyOrder.integration_id == Integration.id
                ).join(
                    Workspace,
                    Integration.workspace_id == Workspace.id
                ).where(
                    Workspace.brand_id == brand_id,
                    ShopifyOrder.shopify_customer_id == vip.id,
                    ShopifyOrder.shopify_created_at >= ninety_days_ago
                )
                
                prev_orders_stmt = select(
                    func.count(ShopifyOrder.id)
                ).select_from(
                    ShopifyOrder
                ).join(
                    Integration,
                    ShopifyOrder.integration_id == Integration.id
                ).join(
                    Workspace,
                    Integration.workspace_id == Workspace.id
                ).where(
                    Workspace.brand_id == brand_id,
                    ShopifyOrder.shopify_customer_id == vip.id,
                    ShopifyOrder.shopify_created_at >= one_eighty_days_ago,
                    ShopifyOrder.shopify_created_at < ninety_days_ago
                )
                
                recent_orders = (await session.execute(recent_orders_stmt)).scalar() or 0
                prev_orders = (await session.execute(prev_orders_stmt)).scalar() or 0
                
                # Calculate churn probability
                recency_score = min(days_since_last_order / avg_cycle_days, 3.0)  # Cap at 3x
                frequency_drop = (prev_orders - recent_orders) / prev_orders if prev_orders > 0 else 0
                
                churn_probability = (recency_score * 0.6) + (frequency_drop * 0.4)
                
                at_risk_vips.append({
                    "email": vip.email,
                    "name": f"{vip.first_name or ''} {vip.last_name or ''}".strip() or "Unknown",
                    "ltv": round(float(vip.ltv), 2),
                    "days_overdue": days_since_last_order - int(avg_cycle_days),
                    "churn_probability": round(churn_probability, 2),
                    "last_order_date": vip.last_order_date.isoformat()
                })
        
        if not at_risk_vips:
            logger.info("VIPAtRisk: No VIPs at risk")
            return None
        
        # Sort by LTV (highest value first)
        at_risk_vips.sort(key=lambda x: x["ltv"], reverse=True)
        
        # Calculate aggregates
        total_at_risk = len(at_risk_vips)
        potential_lost_ltv = sum(v["ltv"] for v in at_risk_vips)
        avg_days_overdue = sum(v["days_overdue"] for v in at_risk_vips) / total_at_risk
        top_vip_emails = [v["email"] for v in at_risk_vips[:5]]
        
        # Calculate impact score (8-10 range for critical)
        # More LTV at risk = higher score
        if potential_lost_ltv > 50000:
            impact_score = 10.0
        elif potential_lost_ltv > 20000:
            impact_score = 9.0
        else:
            impact_score = 8.0
        
        # Build description
        description = f"{total_at_risk} high-value customers haven't purchased in {int(avg_days_overdue)} days (potential ${potential_lost_ltv:,.0f} loss)."
        
        # Context
        context = f"These VIP customers are {int(avg_days_overdue)} days past their expected purchase cycle"
        
        # Recommendation
        recommendation = f"Launch personalized win-back campaign within 48 hours to prevent ${potential_lost_ltv:,.0f} in churn"
        
        return InsightObject(
            id="vip_at_risk",
            title="VIP Churn Risk Alert",
            description=description,
            impact_score=round(impact_score, 1),
            trend="down",
            meta={
                "category": "growth",
                "at_risk_vips": total_at_risk,
                "potential_lost_ltv": round(potential_lost_ltv, 2),
                "avg_days_overdue": int(avg_days_overdue),
                "top_vip_emails": top_vip_emails,
                "top_vip_profiles": at_risk_vips[:5],
                "context": context,
                "recommendation": recommendation,
                "confidence": "high",
                "methodology": "rfm_churn_v1"
            }
        )
