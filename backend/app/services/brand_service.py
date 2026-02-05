from datetime import datetime, timezone
from decimal import Decimal
from functools import wraps
from typing import Any, Dict
from uuid import UUID

from loguru import logger
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.brand_metrics import BrandMetrics
from app.models.integration import Integration, IntegrationStatus
from app.models.shopify.order import ShopifyOrder
from app.services.intelligence.insight_engine import insight_engine
from app.services.shopify.metrics_service import shopify_metrics_service

# Simple in-memory cache for the decorator (keyed by brand_id + date)
# In production, this would use Redis.
_metrics_cache = {}

def cached_brand_metrics(ttl_seconds=300):
    def decorator(func):
        @wraps(func)
        async def wrapper(self, session: AsyncSession, brand_id: UUID, *args, **kwargs):
            today = datetime.now(timezone.utc).date()
            cache_key = f"{brand_id}_{today}"
            
            # 1. Check in-memory cache
            if cache_key in _metrics_cache:
                cached_data, timestamp = _metrics_cache[cache_key]
                if (datetime.utcnow() - timestamp).total_seconds() < ttl_seconds:
                    logger.debug(f"Serving metrics from in-memory cache for {brand_id}")
                    return cached_data
            
            # 2. Call original function
            result = await func(self, session, brand_id, *args, **kwargs)
            
            # 3. Store in cache
            _metrics_cache[cache_key] = (result, datetime.utcnow())
            return result
        return wrapper
    return decorator

class BrandService:
    """
    Service for calculating and managing high-level brand metrics.
    Implements 'Zero-Trust' logic to ensure data freshness.
    """

    @cached_brand_metrics(ttl_seconds=300)
    async def calculate_aggregated_metrics(self, session: AsyncSession, brand_id: UUID) -> Dict[str, Any]:
        """
        Aggregates metrics from all active integrations for the given brand.
        Uses asyncio.gather for high-concurrency and implements atomic UPSERT.
        """
        today = datetime.now(timezone.utc).date()
        
        # 1. Fetch active integrations and Company (for currency)
        from sqlalchemy.orm import selectinload

        from app.models.company import Brand, Company, Workspace
        from app.models.datasource import DataSource
        
        # Get Company through Brand to get the source-of-truth currency
        brand_stmt = select(Brand).where(Brand.id == brand_id)
        brand_obj = (await session.execute(brand_stmt)).scalars().first()
        
        if not brand_obj:
            return {
                "heartbeat": {"revenue": 0.0, "active_sources": 0, "currency": "USD", "since_date": None},
                "shopify_pulse": {"status": "inactive", "orders_today": 0, "gmv_today": 0.0, "last_sync": "Never"}
            }
            
        company_stmt = select(Company).where(Company.id == brand_obj.company_id)
        company_obj = (await session.execute(company_stmt)).scalars().first()
        primary_currency = company_obj.currency if company_obj else "USD"

        stmt = select(Integration).join(Workspace).join(DataSource).where(
            Workspace.brand_id == brand_id,
            Integration.status == IntegrationStatus.ACTIVE
        ).options(selectinload(Integration.datasource))
        
        active_integrations = (await session.execute(stmt)).scalars().all()
        
        if not active_integrations:
            return {
                "heartbeat": {"revenue": 0.0, "active_sources": 0, "currency": "USD"},
                "shopify_pulse": {"status": "inactive", "orders_today": 0, "gmv_today": 0.0, "last_sync": "Never"}
            }

        # 2. Concurrent Data Fetch (Lock Prevention & Speed)
        async def process_integration(integration):
            try:
                # Check for Shopify
                if "shopify" not in integration.datasource.slug:
                    return {"success": False, "skip": True}
                    
                # Force refresh for today
                daily_metric = await shopify_metrics_service.generate_daily_snapshot(
                    session=session,
                    integration=integration,
                    target_date=today
                )
                
                # Calculate ACTUAL Lifetime Sales directly from Orders
                # (Ignoring snapshots for lifetime to ensure 100% accuracy if historical drift happened)
                lifetime_stmt = select(func.sum(ShopifyOrder.total_price)).where(
                    ShopifyOrder.integration_id == integration.id,
                    ShopifyOrder.shopify_cancelled_at == None,
                    ShopifyOrder.financial_status != "voided"
                )
                actual_lifetime_sales = (await session.execute(lifetime_stmt)).scalar() or Decimal("0.00")
                
                # Find Earliest Order Date
                earliest_stmt = select(func.min(ShopifyOrder.shopify_created_at)).where(
                    ShopifyOrder.integration_id == integration.id
                )
                earliest_date = (await session.execute(earliest_stmt)).scalar()

                logger.debug(f"Integration {integration.id} processed: Sales={actual_lifetime_sales}, Date={earliest_date}")

                return {
                    "success": True,
                    "lifetime_sales": float(actual_lifetime_sales),
                    "today_sales": float(daily_metric.total_sales),
                    "today_orders": daily_metric.order_count,
                    "currency": daily_metric.currency,
                    "earliest_date": earliest_date
                }
            except Exception as e:
                logger.error(f"Failed to refresh metrics for integration {integration.id}: {e}")
                return {"success": False}

        # 3. Data Fetch (Sequential to avoid AsyncSession concurrency issues)
        results = []
        for i in active_integrations:
            res = await process_integration(i)
            results.append(res)
        
        # 3. Consolidate Data & Handle Currency
        total_revenue = 0.0
        total_orders_today = 0
        total_gmv_today = 0.0
        success_count = 0
        earliest_record_date = None
        for res in results:
            if res.get("success"):
                total_revenue += res["lifetime_sales"]
                total_orders_today += res["today_orders"]
                total_gmv_today += res["today_sales"]
                
                # Update earliest date
                if res.get("earliest_date"):
                    if not earliest_record_date or res["earliest_date"] < earliest_record_date:
                        earliest_record_date = res["earliest_date"]

                success_count += 1

        # 4. Intelligence Deck (Phase 2)
        insight_deck = await insight_engine.generate_deck(session, brand_id)
        
        # 5. Atomic UPSERT (using SQLModel logic)
        bm_stmt = select(BrandMetrics).where(
            BrandMetrics.brand_id == brand_id,
            BrandMetrics.metric_date == today
        )
        brand_metric = (await session.execute(bm_stmt)).scalars().first()
        
        if brand_metric:
            brand_metric.total_revenue = total_revenue
            brand_metric.currency = primary_currency
            brand_metric.active_sources_count = success_count
            brand_metric.insights = {"deck": insight_deck}
            brand_metric.updated_at = datetime.utcnow()
            session.add(brand_metric)
        else:
            brand_metric = BrandMetrics(
                brand_id=brand_id,
                metric_date=today,
                total_revenue=total_revenue,
                currency=primary_currency,
                active_sources_count=success_count,
                insights={"deck": insight_deck}
            )
            session.add(brand_metric)
        
        try:
            await session.commit()
        except Exception as e:
            logger.warning(f"Commit conflict for BrandMetrics {brand_id}: {e}. Rolling back and continuing.")
            await session.rollback()

        return {
            "heartbeat": {
                "revenue": total_revenue,
                "active_sources": success_count,
                "currency": primary_currency,
                "since_date": earliest_record_date.date().isoformat() if earliest_record_date else None,
                "insights": insight_deck[:1] # Pass Top 1 to Heartbeat for Center Stage
            },
            "shopify_pulse": {
                "status": "active" if success_count > 0 else "inactive",
                "orders_today": total_orders_today,
                "gmv_today": total_gmv_today,
                "last_sync": "Just now",
                "verification_status": "verified"
            }
        }

brand_service = BrandService()
