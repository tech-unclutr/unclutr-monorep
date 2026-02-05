from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from loguru import logger
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.integration import Integration
from app.models.integration_analytics import IntegrationDailyMetric
from app.models.shopify.customer import ShopifyCustomer
from app.models.shopify.order import ShopifyOrder
from app.models.shopify.transaction import ShopifyTransaction
from app.services.analytics.base import BaseAnalyticsProvider


class ShopifyAnalyticsProvider(BaseAnalyticsProvider):
    async def calculate_daily_metrics(
        self, 
        session: AsyncSession, 
        integration: Integration, 
        target_date: date
    ) -> IntegrationDailyMetric:
        logger.info(f"Calculating Shopify Metrics for {integration.id} on {target_date}")

        start_dt = datetime.combine(target_date, datetime.min.time())
        end_dt = start_dt + timedelta(days=1)

        # 1. Fetch Orders for the date
        order_stmt = select(ShopifyOrder).where(
            ShopifyOrder.integration_id == integration.id,
            ShopifyOrder.shopify_created_at >= start_dt,
            ShopifyOrder.shopify_created_at < end_dt
        )
        orders = (await session.execute(order_stmt)).scalars().all()

        # 2. Fetch Refunds (Transaction-based)
        refund_stmt = select(func.sum(ShopifyTransaction.amount)).where(
            ShopifyTransaction.integration_id == integration.id,
            ShopifyTransaction.kind == "refund",
            ShopifyTransaction.status == "success",
            ShopifyTransaction.shopify_processed_at >= start_dt,
            ShopifyTransaction.shopify_processed_at < end_dt
        )
        total_refunds = (await session.execute(refund_stmt)).scalar() or Decimal("0.00")
        total_refunds = Decimal(str(total_refunds))

        # 3. Aggregates for Orders
        gross_sales = Decimal("0.00")
        total_discounts = Decimal("0.00")
        total_tax = Decimal("0.00")
        total_shipping = Decimal("0.00")
        order_count = len(orders)

        for order in orders:
            gross_sales += order.subtotal_price + order.total_discounts
            total_discounts += order.total_discounts
            total_tax += order.total_tax
            total_shipping += order.total_shipping

        net_sales = gross_sales - total_discounts - total_refunds
        total_sales = gross_sales - total_discounts + total_tax + total_shipping

        # 4. New Customers
        customer_stmt = select(func.count(ShopifyCustomer.id)).where(
            ShopifyCustomer.integration_id == integration.id,
            ShopifyCustomer.shopify_created_at >= start_dt,
            ShopifyCustomer.shopify_created_at < end_dt
        )
        customer_count_new = (await session.execute(customer_stmt)).scalar() or 0

        # UPSERT into the generic table
        stmt = select(IntegrationDailyMetric).where(
            IntegrationDailyMetric.integration_id == integration.id,
            IntegrationDailyMetric.snapshot_date == target_date,
            IntegrationDailyMetric.metric_type == "ecom"
        )
        existing = (await session.execute(stmt)).scalars().first()

        metric_data = {
            "integration_id": integration.id,
            "company_id": integration.company_id,
            "snapshot_date": target_date,
            "metric_type": "ecom",
            "total_sales": total_sales,
            "net_sales": net_sales,
            "gross_sales": gross_sales,
            "count_primary": order_count,
            "count_secondary": customer_count_new,
            "total_discounts": total_discounts,
            "total_refunds": total_refunds,
            "total_tax": total_tax,
            "total_shipping": total_shipping,
            "average_value": total_sales / order_count if order_count > 0 else 0,
            "currency": orders[0].currency if orders else "USD",
            "meta_data": {
                "source": "shopify",
                "sync_timestamp": datetime.now(timezone.utc).isoformat()
            }
        }

        if existing:
            for key, value in metric_data.items():
                setattr(existing, key, value)
            session.add(existing)
            return existing
        else:
            new_metric = IntegrationDailyMetric(**metric_data)
            session.add(new_metric)
            return new_metric
