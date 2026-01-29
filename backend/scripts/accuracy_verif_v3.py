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

async def test_accuracy_verif_v3():
    async with async_session_factory() as session:
        # Guaranteed Unique
        uhex = uuid.uuid4().hex
        company_id = uuid.uuid4()
        int_id = uuid.uuid4()
        
        print(f"Starting Verif V3. Company ID: {company_id}")
        
        # 1. SETUP
        try:
            # Create Company
            company = Company(id=company_id, brand_name=f"V3 Audit {uhex[:8]}")
            session.add(company)
            await session.commit()
            print(f"Committed Company {company_id}")
            
            # Create Brand
            brand_id = uuid.uuid4()
            brand = Brand(id=brand_id, name=f"V3 Brand {uhex[:8]}", company_id=company_id)
            session.add(brand)
            await session.commit()
            
            # Create DataSource
            ds_id = uuid.uuid4()
            unique_slug = f"v3-audit-{uhex}"
            ds = DataSource(id=ds_id, name=f"V3 DS {uhex[:8]}", slug=unique_slug, category="Storefront")
            session.add(ds)
            await session.commit()
            
            # Create Workspace
            ws_id = uuid.uuid4()
            workspace = Workspace(id=ws_id, name=f"V3 WS {uhex[:8]}", brand_id=brand_id, company_id=company_id)
            session.add(workspace)
            await session.commit()
            
            # Create Integration
            integration = Integration(
                id=int_id, 
                name="V3 Store", 
                status=IntegrationStatus.ACTIVE, 
                company_id=company_id,
                workspace_id=ws_id,
                datasource_id=ds_id
            )
            session.add(integration)
            await session.commit()
            print("Setup hierarchy complete.")
        except Exception as e:
            print(f"Setup failed: {e}")
            await session.rollback()
            return

        # 2. CREATE ORDERS
        try:
            today = datetime.now(timezone.utc).date()
            start_of_today = datetime.combine(today, datetime.min.time())
            
            order1 = ShopifyOrder(
                id=uuid.uuid4(),
                integration_id=int_id,
                company_id=company_id,
                shopify_order_id=uuid.uuid4().int & (1<<63)-1,
                shopify_order_number=3001,
                shopify_name="#3001",
                financial_status="paid",
                subtotal_price=Decimal("100.00"),
                total_discounts=Decimal("20.00"),
                total_tax=Decimal("10.00"),
                total_shipping=Decimal("5.00"),
                total_price=Decimal("95.00"),
                shopify_created_at=start_of_today + timedelta(hours=1)
            )
            
            order2 = ShopifyOrder(
                id=uuid.uuid4(),
                integration_id=int_id,
                company_id=company_id,
                shopify_order_id=uuid.uuid4().int & (1<<63)-1,
                shopify_order_number=3002,
                shopify_name="#3002",
                financial_status="paid",
                shopify_created_at=start_of_today + timedelta(hours=2),
                shopify_cancelled_at=start_of_today + timedelta(hours=3)
            )

            session.add(order1)
            session.add(order2)
            await session.commit()
            print("Committed orders.")
        except Exception as e:
            print(f"Order creation failed: {e}")
            await session.rollback()
            return

        # 3. REFUND & GENERATE
        try:
            refund = ShopifyTransaction(
                id=uuid.uuid4(),
                integration_id=int_id,
                company_id=company_id,
                shopify_transaction_id=uuid.uuid4().int & (1<<63)-1,
                order_id=order1.id,
                kind="refund",
                status="success",
                amount=Decimal("30.00"),
                shopify_processed_at=start_of_today + timedelta(hours=4)
            )
            session.add(refund)
            await session.commit()
            
            # Fetch integration again to avoid detached session issues
            integration = (await session.execute(select(Integration).where(Integration.id == int_id))).scalar_one()
            
            snapshot = await shopify_metrics_service.generate_daily_snapshot(session, integration, today)
            await session.commit()
            
            print("\n--- V3 AUDIT ---")
            print(f"Gross: {snapshot.gross_sales}")
            print(f"Net: {snapshot.net_sales}")
            print(f"Total: {snapshot.total_sales}")
            
            if snapshot.total_sales == Decimal("85.00") and snapshot.order_count == 1:
                print("\n✅ ACCURACY VERIFIED 100%")
            else:
                print(f"\n❌ MISMATCH: Exp 85.00/1, Got {snapshot.total_sales}/{snapshot.order_count}")
        except Exception as e:
            print(f"Metrics generation failed: {e}")
            await session.rollback()

        # 4. CLEANUP
        try:
            await session.execute(delete(ShopifyTransaction).where(ShopifyTransaction.integration_id == int_id))
            await session.execute(delete(ShopifyDailyMetric).where(ShopifyDailyMetric.integration_id == int_id))
            await session.execute(delete(ShopifyOrder).where(ShopifyOrder.integration_id.in_([int_id])))
            await session.execute(delete(Integration).where(Integration.id == int_id))
            await session.execute(delete(Workspace).where(Workspace.id == ws_id))
            await session.execute(delete(Brand).where(Brand.id == brand_id))
            await session.execute(delete(Company).where(Company.id == company_id))
            await session.execute(delete(DataSource).where(DataSource.id == ds_id))
            await session.commit()
            print("Cleanup complete.")
        except Exception as e:
            print(f"Cleanup failed: {e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(test_accuracy_verif_v3())
