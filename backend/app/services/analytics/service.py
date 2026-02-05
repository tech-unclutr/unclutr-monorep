from datetime import date, timedelta
from typing import Any, Dict, List
from uuid import UUID

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.integration import Integration
from app.models.integration_analytics import IntegrationDailyMetric
from app.services.analytics.base import AnalyticsFactory
from app.services.analytics.shopify import ShopifyAnalyticsProvider

# Register providers
AnalyticsFactory.register("shopify", ShopifyAnalyticsProvider())

class AnalyticsService:
    @staticmethod
    async def get_overview(session: AsyncSession, integration: Integration) -> Dict[str, Any]:
        """
        Returns high-level aggregated metrics for the last 30 days.
        """
        today = date.today()
        start_date = today - timedelta(days=30)
        
        stmt = select(IntegrationDailyMetric).where(
            IntegrationDailyMetric.integration_id == integration.id,
            IntegrationDailyMetric.snapshot_date >= start_date
        ).order_by(IntegrationDailyMetric.snapshot_date.asc())
        
        result = await session.execute(stmt)
        metrics = result.scalars().all()
        
        total_sales_30d = sum(m.total_sales for m in metrics)
        order_count_30d = sum(m.count_primary for m in metrics)
        
        # Growth calculation (Mocked for now, comparing last 30 vs previous 30 in future)
        growth_pct = 12.5 

        return {
            "metrics_30d": metrics,
            "summary": {
                "total_sales_30d": float(total_sales_30d),
                "growth_pct": growth_pct,
                "order_count_30d": order_count_30d
            }
        }

    @staticmethod
    async def get_daily_metrics(
        session: AsyncSession, 
        integration_id: UUID, 
        days: int = 30
    ) -> List[IntegrationDailyMetric]:
        """
        Fetches daily snapshots for a range.
        """
        start_date = date.today() - timedelta(days=days)
        stmt = select(IntegrationDailyMetric).where(
            IntegrationDailyMetric.integration_id == integration_id,
            IntegrationDailyMetric.snapshot_date >= start_date
        ).order_by(IntegrationDailyMetric.snapshot_date.asc())
        
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def refresh_snapshot(
        session: AsyncSession, 
        integration: Integration, 
        target_date: date
    ) -> IntegrationDailyMetric:
        """
        Delegates calculation to the appropriate provider and saves snapshot.
        """
        # Ensure datasource is loaded safely in async
        from app.models.datasource import DataSource
        datasource_slug = None
        
        # Try to get from metadata first if cached there
        if integration.metadata_info and "datasource_slug" in integration.metadata_info:
             datasource_slug = integration.metadata_info["datasource_slug"]
        
        if not datasource_slug:
             stmt = select(DataSource.slug).where(DataSource.id == integration.datasource_id)
             datasource_slug = (await session.execute(stmt)).scalar()
             
        if not datasource_slug:
             raise ValueError(f"Could not determine datasource for integration {integration.id}")
             
        provider = AnalyticsFactory.get_provider(datasource_slug)
        return await provider.calculate_daily_metrics(session, integration, target_date)
