import asyncio
import uuid
from datetime import date, timezone, datetime, timedelta
from decimal import Decimal
from sqlmodel import select, delete
from app.core.db import async_session_factory
from app.models.shopify.order import ShopifyOrder
from app.models.shopify.transaction import ShopifyTransaction
from app.models.shopify.metrics import ShopifyDailyMetric
from app.models.integration import Integration, IntegrationStatus
from app.models.company import Company, Brand, Workspace
from app.models.datasource import DataSource
from app.services.shopify.metrics_service import shopify_metrics_service

async def test_accuracy_refactor():
    async with async_session_factory() as session:
        # 1. Setup Mock Data (Guaranteed Unique)
        unique_id = uuid.uuid4().hex
        company_id = uuid.uuid4()
        int_id = uuid.uuid4()
        
        # Create Company
        company = Company(id=company_id, brand_name=f"Accuracy Audit {unique_id[:8]}")
        session.add(company)
        
        # Create Brand
        brand_id = uuid.uuid4()
        brand = Brand(id=brand_id, name=f"Accuracy Brand {unique_id[:8]}", company_id=company_id)
        session.add(brand)
        
        # Create DataSource
        ds_id = uuid.uuid4()
        unique_slug = f"qa-shopify-{unique_id}"
        ds = DataSource(id=ds_id, name=f"QA Shopify DS {unique_id[:8]}", slug=unique_slug, category="Storefront")
        session.add(ds)
        await session.commit()
        
        # Create Workspace
        ws_id = uuid.uuid4()
        workspace = Workspace(id=ws_id, name="QA Workspace", brand_id=brand_id, company_id=company_id)
        session.add(workspace)
        await session.commit()
        
        # Create Integration
        integration = Integration(
            id=int_id, 
            name="Accuracy Store", 
            status=IntegrationStatus.ACTIVE, 
            company_id=company_id,
            workspace_id=ws_id,
            datasource_id=ds_id
        )
        session.add(integration)
        await session.commit()
        
        today = datetime.now(timezone.utc).date()
        start_of_today = datetime.combine(today, datetime.min.time())
        
        # Scenario A: Normal Order ($100 + $10 Tax + $5 Shipping - $20 Discount = $95 Total)
        # Gross = Subtotal + Discount = 100 + 20 = 120? 
        # Wait, if Subtotal is line items, then Gross = 120.
        order_normal = ShopifyOrder(
            id=uuid.uuid4(),
            integration_id=int_id,
            company_id=company_id,
            shopify_order_id=1001,
            shopify_order_number=1001,
            shopify_name="#1001",
            financial_status="paid",
            subtotal_price=Decimal("100.00"),
            total_discounts=Decimal("20.00"),
            total_tax=Decimal("10.00"),
            total_shipping=Decimal("5.00"),
            total_price=Decimal("95.00"),
            shopify_created_at=start_of_today + timedelta(hours=10)
        )
        
        # Scenario B: Cancelled Order (Should be IGNORED)
        order_cancelled = ShopifyOrder(
            id=uuid.uuid4(),
            integration_id=int_id,
            company_id=company_id,
            shopify_order_id=1002,
            shopify_order_number=1002,
            shopify_name="#1002",
            financial_status="paid",
            subtotal_price=Decimal("500.00"),
            shopify_created_at=start_of_today + timedelta(hours=11),
            shopify_cancelled_at=start_of_today + timedelta(hours=12)
        )
        
        # Scenario C: Voided Order (Should be IGNORED)
        order_voided = ShopifyOrder(
            id=uuid.uuid4(),
            integration_id=int_id,
            company_id=company_id,
            shopify_order_id=1003,
            shopify_order_number=1003,
            shopify_name="#1003",
            financial_status="voided",
            subtotal_price=Decimal("1000.00"),
            shopify_created_at=start_of_today + timedelta(hours=13)
        )
        
        session.add(order_normal)
        session.add(order_cancelled)
        session.add(order_voided)
        await session.commit()
        
        # Scenario D: Refund Transaction ($30 refund processed today)
        refund_txn = ShopifyTransaction(
            id=uuid.uuid4(),
            integration_id=int_id,
            company_id=company_id,
            shopify_transaction_id=999,
            order_id=order_normal.id,
            kind="refund",
            status="success",
            amount=Decimal("30.00"),
            shopify_processed_at=start_of_today + timedelta(hours=14)
        )
        session.add(refund_txn)
        await session.commit()
        
        print(f"Setup complete. Running Accuracy Audit for {today}...")
        
        # 2. Generate Snapshot
        snapshot = await shopify_metrics_service.generate_daily_snapshot(session, integration, today)
        await session.commit()
        
        # 3. Verify Logic
        # Expected:
        # Gross Sales = 100 (Subtotal) + 20 (Discounts) = 120.00
        # Discounts = 20.00
        # Refunds = 30.00
        # Net Sales = 120 - 20 - 30 = 70.00
        # Total Sales = 70 (Net) + 10 (Tax) + 5 (Shipping) = 85.00
        
        print("\n--- AUDIT RESULTS ---")
        print(f"Gross Sales: {snapshot.gross_sales}")
        print(f"Net Sales: {snapshot.net_sales}")
        print(f"Total Sales: {snapshot.total_sales}")
        print(f"Order Count: {snapshot.order_count} (Expected: 1)")
        print(f"Total Refunds: {snapshot.total_refunds} (Expected: 30.0)")
        
        success = True
        if snapshot.order_count != 1:
            print("❌ FAILED: Cancelled/Voided orders were NOT excluded count.")
            success = False
        if snapshot.total_sales != Decimal("85.00"):
            print(f"❌ FAILED: Total Sales mismatch. Got {snapshot.total_sales}, expected 85.00")
            success = False
        if snapshot.net_sales != Decimal("70.00"):
            print(f"❌ FAILED: Net Sales mismatch. Got {snapshot.net_sales}, expected 70.00")
            success = False
            
        if success:
            print("\n✅ VERDICT: 100% ACCURACY ATTAINED. Financial status and arithmetic verified.")
        else:
            print("\n❌ VERDICT: ACCURACY GAP DETECTED.")

        # 4. Cleanup
        await session.execute(delete(ShopifyTransaction).where(ShopifyTransaction.integration_id == int_id))
        await session.execute(delete(ShopifyOrder).where(ShopifyOrder.integration_id == int_id))
        await session.execute(delete(ShopifyDailyMetric).where(ShopifyDailyMetric.integration_id == int_id))
        await session.execute(delete(Integration).where(Integration.id == int_id))
        await session.execute(delete(Workspace).where(Workspace.id == ws_id))
        await session.execute(delete(Brand).where(Brand.id == brand_id))
        await session.execute(delete(Company).where(Company.id == company_id))
        await session.execute(delete(DataSource).where(DataSource.id == ds_id))
        await session.commit()
        print("\nCleanup complete.")

if __name__ == "__main__":
    asyncio.run(test_accuracy_refactor())
