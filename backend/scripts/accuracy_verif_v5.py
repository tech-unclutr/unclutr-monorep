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

async def test_accuracy_v5():
    async with async_session_factory() as session:
        uhex = uuid.uuid4().hex[:8]
        company_id = uuid.uuid4()
        brand_id = uuid.uuid4()
        ws_id = uuid.uuid4()
        ds_id = uuid.uuid4()
        int_id = uuid.uuid4()
        
        print(f"Starting V5 Audit (uhex: {uhex})")
        
        try:
            # 1. SETUP HIERARCHY
            co = Company(id=company_id, brand_name=f"V5 Audit {uhex}")
            session.add(co)
            
            br = Brand(id=brand_id, name=f"V5 Brand {uhex}", company_id=company_id)
            session.add(br)
            
            ds = DataSource(id=ds_id, name=f"V5 DS {uhex}", slug=f"v5-ds-{uhex}", category="Storefront")
            session.add(ds)
            
            ws = Workspace(id=ws_id, name=f"V5 WS {uhex}", brand_id=brand_id, company_id=company_id)
            session.add(ws)
            
            intg = Integration(
                id=int_id, 
                name=f"V5 Store {uhex}", 
                status=IntegrationStatus.ACTIVE, 
                company_id=company_id,
                workspace_id=ws_id, 
                datasource_id=ds_id
            )
            session.add(intg)
            
            await session.commit()
            print("Setup hierarchy complete.")
            
            # 2. SEED DATA
            today = datetime.now(timezone.utc).date()
            start_of_today = datetime.combine(today, datetime.min.time())
            
            # Normal Paid Order: $120 Gross, $20 Disc, $10 Tax, $5 Ship -> $85 Total (after $30 refund)
            o1 = ShopifyOrder(
                id=uuid.uuid4(),
                integration_id=int_id,
                company_id=company_id,
                shopify_order_id=uuid.uuid4().int % (10**10),
                shopify_order_number=5001,
                shopify_name="#5001",
                financial_status="paid",
                subtotal_price=Decimal("100.00"),
                total_discounts=Decimal("20.00"),
                total_tax=Decimal("10.00"),
                total_shipping=Decimal("5.00"),
                total_price=Decimal("95.00"),
                shopify_created_at=start_of_today + timedelta(hours=1)
            )
            
            # Cancelled Order (should be excluded)
            o2 = ShopifyOrder(
                id=uuid.uuid4(),
                integration_id=int_id,
                company_id=company_id,
                shopify_order_id=uuid.uuid4().int % (10**10),
                shopify_order_number=5002,
                shopify_name="#5002",
                financial_status="paid",
                shopify_created_at=start_of_today + timedelta(hours=2),
                shopify_cancelled_at=start_of_today + timedelta(hours=3)
            )
            
            session.add(o1)
            session.add(o2)
            await session.commit()
            
            # Refund for o1
            t1 = ShopifyTransaction(
                id=uuid.uuid4(),
                integration_id=int_id,
                company_id=company_id,
                shopify_transaction_id=uuid.uuid4().int % (10**10),
                order_id=o1.id,
                kind="refund",
                status="success",
                amount=Decimal("30.00"),
                shopify_processed_at=start_of_today + timedelta(hours=4)
            )
            session.add(t1)
            await session.commit()
            print("Seeded data complete.")
            
            # 3. VERIFY METRICS
            # Re-fetch integration to avoid detachment
            integration = (await session.execute(select(Integration).where(Integration.id == int_id))).scalar_one()
            
            snapshot = await shopify_metrics_service.generate_daily_snapshot(session, integration, today)
            await session.commit()
            
            print(f"Gross: {snapshot.gross_sales}")
            print(f"Net: {snapshot.net_sales}")
            print(f"Total: {snapshot.total_sales}")
            print(f"Order Count: {snapshot.order_count}")
            
            # EXPECTED:
            # Gross = 100 + 20 = 120.00
            # Net = 120 - 20 - 30 = 70.00
            # Total = 70 + 10 + 5 = 85.00
            
            if snapshot.total_sales == Decimal("85.00") and snapshot.order_count == 1:
                print("\n✅ V5 VERDICT: 100% ACCURACY ATTAINED.")
            else:
                print(f"\n❌ V5 VERDICT: MISMATCH. Exp 85.00/1, Got {snapshot.total_sales}/{snapshot.order_count}")
                
        finally:
            # 4. CLEANUP (Strict Hierarchy)
            print("Cleaning up...")
            await session.execute(delete(ShopifyTransaction).where(ShopifyTransaction.integration_id == int_id))
            await session.execute(delete(ShopifyDailyMetric).where(ShopifyDailyMetric.integration_id == int_id))
            await session.execute(delete(ShopifyOrder).where(ShopifyOrder.integration_id == int_id))
            await session.execute(delete(Integration).where(Integration.id == int_id))
            await session.execute(delete(Workspace).where(Workspace.id == ws_id))
            await session.execute(delete(Brand).where(Brand.id == brand_id))
            await session.execute(delete(Company).where(Company.id == company_id))
            await session.execute(delete(DataSource).where(DataSource.id == ds_id))
            await session.commit()
            print("Cleanup done.")

if __name__ == "__main__":
    asyncio.run(test_accuracy_v5())
