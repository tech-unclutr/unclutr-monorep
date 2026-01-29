import sys
import os
import asyncio
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), '..')))

from sqlmodel import select, delete
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.core.config import settings
from app.models.shopify.order import ShopifyOrder, ShopifyLineItem
from app.models.shopify.transaction import ShopifyTransaction
from app.models.shopify.metrics import ShopifyDailyMetric
from app.models.integration import Integration
from app.services.shopify.metrics_service import shopify_metrics_service

async def verify_metrics():
    engine = create_async_engine(settings.DATABASE_URL.replace("asyncpg", "asyncpg"))
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        # 1. Setup - Get an Integration
        integration = (await session.execute(select(Integration).limit(1))).scalars().first()
        if not integration:
            print("❌ No integration found. Please link a Shopify store first.")
            return

        print(f"Using Integration: {integration.id}")

        # Clean up old test data for today/yesterday to avoid pollution
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        # 2. Cleanup old test data
        await session.execute(delete(ShopifyTransaction).where(ShopifyTransaction.shopify_transaction_id.in_([777777])))
        await session.execute(delete(ShopifyOrder).where(ShopifyOrder.shopify_order_id.in_([999999, 888888])))
        await session.commit()

        # 3. Scenario 1: Order Today
        # Gross: 100, Discount: 10, Tax: 5, Shipping: 15
        # Total Sales = 100 - 10 + 5 + 15 = 110
        # Net Sales = 100 - 10 = 90
        
        order1 = ShopifyOrder(
            integration_id=integration.id,
            company_id=integration.company_id,
            shopify_order_id=999999,
            shopify_order_number=999999,
            shopify_name="#TEST-999",
            financial_status="paid",
            total_price=Decimal("110.00"),
            subtotal_price=Decimal("90.00"), # Box Price (100) - Discount (10)
            total_tax=Decimal("5.00"),
            total_discounts=Decimal("10.00"),
            total_shipping=Decimal("15.00"),
            total_shipping_tax=Decimal("0.00"),
            currency="USD",
            shopify_created_at=datetime.utcnow(),
            shopify_updated_at=datetime.utcnow(),
        )
        session.add(order1)
        await session.commit()
        
        print("✅ Simulating Order Today...")
        metric_today = await shopify_metrics_service.generate_daily_snapshot(session, integration, today)
        await session.commit()
        await session.refresh(metric_today)
        
        print(f"Metrics Today: Gross={metric_today.gross_sales}, Net={metric_today.net_sales}, Total={metric_today.total_sales}")
        
        # Expected: 
        # Gross = Subtotal(90) + Discount(10) = 100
        # Total = 100 - 10 + 5 + 15 = 110
        # Net = 100 - 10 = 90
        
        assert metric_today.gross_sales == Decimal("100.00")
        assert metric_today.total_sales == Decimal("110.00")
        assert metric_today.net_sales == Decimal("90.00")
        print("✅ Scenario 1 (Order Today) passed.")

        # 3. Scenario 2: Refund Today for Yesterday's Order
        # Yesterday Order: Gross 200
        # Refund Today: 50
        
        order2 = ShopifyOrder(
            integration_id=integration.id,
            company_id=integration.company_id,
            shopify_order_id=888888,
            shopify_order_number=888888,
            shopify_name="#TEST-888",
            financial_status="refunded",
            total_price=Decimal("200.00"),
            subtotal_price=Decimal("200.00"),
            total_tax=Decimal("0.00"),
            total_discounts=Decimal("0.00"),
            total_shipping=Decimal("0.00"),
            shopify_created_at=datetime.utcnow() - timedelta(days=1),
            shopify_updated_at=datetime.utcnow(),
        )
        session.add(order2)
        await session.commit()
        await session.refresh(order2)
        
        refund_txn = ShopifyTransaction(
            integration_id=integration.id,
            company_id=integration.company_id,
            order_id=order2.id,
            shopify_transaction_id=777777,
            shopify_order_id=888888,
            amount=50.00,
            currency="USD",
            kind="refund",
            status="success",
            shopify_processed_at=datetime.utcnow()
        )
        session.add(refund_txn)
        await session.commit()
        
        print("✅ Simulating Refund Today for Yesterday's Order...")
        metric_today_revised = await shopify_metrics_service.generate_daily_snapshot(session, integration, today)
        await session.commit()
        await session.refresh(metric_today_revised)
        
        print(f"Metrics Today Revised: Gross={metric_today_revised.gross_sales}, Net={metric_today_revised.net_sales}, Total={metric_today_revised.total_sales}")
        
        # Expected:
        # Today Order (Gross 100, Net 90)
        # Today Refund (50)
        # Net Sales Today = 90 - 50 = 40
        assert metric_today_revised.net_sales == Decimal("40.00")
        print("✅ Scenario 2 (Refund for old order) passed.")

        # Cleanup
        await session.execute(delete(ShopifyTransaction).where(ShopifyTransaction.shopify_transaction_id.in_([777777])))
        await session.execute(delete(ShopifyOrder).where(ShopifyOrder.shopify_order_id.in_([999999, 888888])))
        await session.commit()
        print("🧹 Cleanup complete.")

if __name__ == "__main__":
    asyncio.run(verify_metrics())
