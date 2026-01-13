from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional, List, Dict
from uuid import UUID

from sqlmodel import select, func, and_
from sqlmodel.ext.asyncio.session import AsyncSession
from loguru import logger

from app.models.shopify.order import ShopifyOrder
from app.models.shopify.customer import ShopifyCustomer
from app.models.shopify.metrics import ShopifyDailyMetric
from app.models.integration import Integration

class ShopifyMetricsService:
    """
    Handles the calculation and storage of store KPIs.
    Supports real-time overview and historical snapshots.
    """

    async def generate_daily_snapshot(
        self, 
        session: AsyncSession, 
        integration: Integration, 
        target_date: date
    ) -> ShopifyDailyMetric:
        """
        Calculates KPIs for a specific date and UPSERTS into ShopifyDailyMetric.
        """
        logger.info(f"Generating Daily Snapshot for Integration {integration.id} on {target_date}")

        # Define time range for the target date (UTC)
        start_dt = datetime.combine(target_date, datetime.min.time())
        end_dt = start_dt + timedelta(days=1)

        # 1. Fetch Orders created on the date
        order_stmt = select(ShopifyOrder).where(
            ShopifyOrder.integration_id == integration.id,
            ShopifyOrder.shopify_created_at >= start_dt,
            ShopifyOrder.shopify_created_at < end_dt
        )
        result = await session.execute(order_stmt)
        orders = result.scalars().all()

        # 2. Fetch Refunds processed on the date (via Transactions)
        from app.models.shopify.transaction import ShopifyTransaction
        refund_stmt = select(func.sum(ShopifyTransaction.amount)).where(
            ShopifyTransaction.integration_id == integration.id,
            ShopifyTransaction.kind == "refund",
            ShopifyTransaction.status == "success",
            ShopifyTransaction.processed_at >= start_dt,
            ShopifyTransaction.processed_at < end_dt
        )
        total_refunds = (await session.execute(refund_stmt)).scalar() or Decimal("0.00")
        total_refunds = Decimal(str(total_refunds)) # Ensure Decimal

        # 3. Aggregates for Orders
        gross_sales = Decimal("0.00")
        total_discounts = Decimal("0.00")
        total_tax = Decimal("0.00")
        total_shipping = Decimal("0.00")
        order_count = len(orders)

        for order in orders:
            # Gross Sales (Shopify definition): Box Price * Quantity (before discounts/tax/shipping)
            # In our model, subtotal_price is usually (price * qty) - discounts? 
            # Actually, let's follow the standard:
            gross_sales += Decimal(str(order.subtotal_price)) + Decimal(str(order.total_discounts))
            total_discounts += Decimal(str(order.total_discounts))
            total_tax += Decimal(str(order.total_tax))
            total_shipping += Decimal(str(order.total_shipping))

        # Net Sales = Gross Sales - Discounts - Refunds
        net_sales = gross_sales - total_discounts - total_refunds
        
        # Total Sales = Gross Sales - Discounts + Tax + Shipping
        total_sales = gross_sales - total_discounts + total_tax + total_shipping

        aov = Decimal("0.00")
        if order_count > 0:
            aov = total_sales / order_count

        # 4. Fetch New Customers
        customer_stmt = select(func.count(ShopifyCustomer.id)).where(
            ShopifyCustomer.integration_id == integration.id,
            ShopifyCustomer.shopify_created_at >= start_dt,
            ShopifyCustomer.shopify_created_at < end_dt
        )
        customer_count_new = (await session.execute(customer_stmt)).scalar() or 0

        # ... (UPSERT logic continues)

        # 4. Check for existing snapshot (UPSERT)
        stmt = select(ShopifyDailyMetric).where(
            ShopifyDailyMetric.integration_id == integration.id,
            ShopifyDailyMetric.snapshot_date == target_date
        )
        existing = (await session.execute(stmt)).scalars().first()

        metric_data = {
            "integration_id": integration.id,
            "company_id": integration.company_id,
            "snapshot_date": target_date,
            "gross_sales": gross_sales,
            "net_sales": net_sales,
            "total_sales": total_sales,
            "total_discounts": total_discounts,
            "total_refunds": total_refunds,
            "total_tax": total_tax,
            "order_count": order_count,
            "customer_count_new": customer_count_new,
            "average_order_value": aov,
            "currency": orders[0].currency if orders else "USD",
            "meta_data": {
                "sync_timestamp": datetime.now(timezone.utc).isoformat(),
                "order_ids": [str(o.id) for o in orders[:10]] # Sample
            }
        }

        if existing:
            for key, value in metric_data.items():
                setattr(existing, key, value)
            session.add(existing)
            logger.info(f"Updated Daily Snapshot for {target_date}")
            return existing
        else:
            new_metric = ShopifyDailyMetric(**metric_data)
            session.add(new_metric)
            logger.info(f"Created Daily Snapshot for {target_date}")
            return new_metric

    async def get_overview_metrics(
        self, 
        session: AsyncSession, 
        integration_id: UUID,
        days: int = 30
    ) -> Dict:
        """
        Returns aggregated metrics for the dashboard overview.
        """
        # Logic to aggregate past X days of snapshots
        # ... to be implemented ...
        pass

shopify_metrics_service = ShopifyMetricsService()
