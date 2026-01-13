import asyncio
from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy.orm import sessionmaker
from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.models.integration import Integration, IntegrationStatus
from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.models.shopify.customer import ShopifyCustomer
from app.models.shopify.address import ShopifyAddress
from app.services.shopify.sync_service import shopify_sync_service
from app.services.shopify.refinement_service import shopify_refinement_service

async_session_factory = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def verify_module_4_e2e():
    print("\n👥 Starting Module 4 E2E Verification (Customers & Addresses)...\n")
    
    async with async_session_factory() as session:
        # 1. Get Active Integration
        stmt = select(Integration).where(Integration.status == IntegrationStatus.ACTIVE)
        integration = (await session.execute(stmt)).scalars().first()
        if not integration:
            print("❌ No active integration found. Aborting.")
            return

        # 2. Mock Customer Payload with Address Book
        customer_payload = {
            "id": 5550001,
            "email": "audit-customer@example.com",
            "first_name": "Audit",
            "last_name": "Customer",
            "state": "enabled",
            "verified_email": True,
            "orders_count": 5,
            "total_spent": "150.00",
            "currency": "USD",
            "addresses": [
                {
                    "id": 4440001,
                    "customer_id": 5550001,
                    "first_name": "Audit",
                    "last_name": "Customer",
                    "company": "Audit Labs",
                    "address1": "123 Audit Way",
                    "city": "Test City",
                    "province": "California",
                    "country": "United States",
                    "zip": "90210",
                    "default": True
                },
                {
                    "id": 4440002,
                    "customer_id": 5550001,
                    "first_name": "Audit",
                    "last_name": "Customer",
                    "address1": "456 Recovery Road",
                    "city": "Backup Springs",
                    "province": "Nevada",
                    "country": "United States",
                    "zip": "89101",
                    "default": False
                }
            ],
            "default_address": {
                "id": 4440001,
                "address1": "123 Audit Way"
            }
        }

        # 3. Simulate Ingestion
        print("📥 Simulating Customer Ingestion...")
        raw = await shopify_sync_service.ingest_raw_object(
            session=session,
            integration=integration,
            object_type="customer",
            payload=customer_payload,
            source="manual_verify"
        )
        await session.commit()
        print(f"✅ Raw record created (ID: {raw.id})")

        # 4. Trigger Refinement
        print("⚙️ Triggering Refinement...")
        # Need to re-open session or use the same one but refresh raw
        async with async_session_factory() as session2:
            num_processed = await shopify_refinement_service.process_pending_records(session2, integration_id=integration.id)
            await session2.commit()
            print(f"✅ Refined {num_processed} records.")

        # 5. Verify Database State
        print("\n🧐 Verifying Database State...")
        async with async_session_factory() as session3:
            # Check Customer
            cust_stmt = select(ShopifyCustomer).where(ShopifyCustomer.shopify_customer_id == 5550001)
            customer = (await session3.execute(cust_stmt)).scalars().first()
            if customer:
                print(f"✅ ShopifyCustomer found: {customer.email}")
                if customer.total_spent == 150.0:
                    print(f"✅ total_spent correctly cast: {customer.total_spent}")
            else:
                print("❌ FAIL: ShopifyCustomer not found!")

            # Check Addresses
            addr_stmt = select(ShopifyAddress).where(ShopifyAddress.shopify_customer_id == 5550001)
            addresses = (await session3.execute(addr_stmt)).scalars().all()
            print(f"📍 Found {len(addresses)} addresses in address book.")
            
            if len(addresses) == 2:
                print("✅ PASS: All 2 addresses correctly stored.")
                for a in addresses:
                    print(f"   - {a.address1} (Default: {a.default})")
            else:
                print(f"❌ FAIL: Expected 2 addresses, found {len(addresses)}")

    print("\n🏁 Module 4 Verification Complete.")

if __name__ == "__main__":
    asyncio.run(verify_module_4_e2e())
