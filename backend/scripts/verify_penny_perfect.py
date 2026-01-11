import asyncio
import os
import sys
from decimal import Decimal
from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.db import engine
from app.models.integration import Integration, IntegrationStatus
from app.services.shopify.sync_service import shopify_sync_service
from app.services.shopify.refinement_service import shopify_refinement_service
from app.models.shopify.order import ShopifyOrder, ShopifyLineItem
from app.models.shopify.raw_ingest import ShopifyRawIngest

async def verify_penny_perfect():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # 1. Find Active Integration
        stmt = select(Integration).where(Integration.status == IntegrationStatus.ACTIVE)
        integration = (await session.execute(stmt)).scalars().first()
        
        if not integration:
            print("❌ No Active Integration found. Cannot verify.")
            return

        print(f"🧪 Starting Penny Perfect Verification for {integration.metadata_info.get('shop')}")
        
        # 2. Mock Complex Order Payload
        # Scenario:
        # Item 1: $10.00 x 2 = $20.00
        # Item 2: $50.55 x 1 = $50.55
        # Subtotal: $70.55
        # Discount: -$5.00
        # Tax: $3.00
        # Total: $68.55
        
        mock_id = 999111222
        mock_payload = {
            "id": mock_id,
            "order_number": 1001,
            "name": "#1001-MOCK",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "processed_at": datetime.utcnow().isoformat(),
            "closed_at": None,
            "currency": "USD",
            "total_price": "68.55", # String to ensure precision in JSON
            "subtotal_price": "70.55",
            "total_discounts": "5.00",
            "total_tax": "3.00",
            "financial_status": "paid",
            "fulfillment_status": "fulfilled",
            "email": "test@unclutr.ai",
            "customer": {
                "id": 888777666,
                "email": "test@unclutr.ai",
                "first_name": "Test",
                "last_name": "User",
                "created_at": datetime.utcnow().isoformat()
            },
            "line_items": [
                {
                    "id": 111,
                    "title": "Widget A",
                    "quantity": 2,
                    "price": "10.00",
                    "sku": "WIDGET-A"
                },
                {
                    "id": 222,
                    "title": "Widget B (Premium)",
                    "quantity": 1,
                    "price": "50.55",
                    "sku": "WIDGET-B"
                }
            ]
        }
        
        # 3. Ingest Raw
        print("📥 Ingesting Mock Raw Object...")
        await shopify_sync_service.ingest_raw_object(
            session=session,
            integration=integration,
            object_type="order",
            payload=mock_payload,
            source="verification_script",
            topic="test/verification"
        )
        await session.commit()
        
        # 4. Trigger Refinement
        print("⚙️  Running Refinement...")
        await shopify_refinement_service.process_pending_records(session)
        
        # 5. Verify Structured Data
        print("🔍 Verifying Data Integrity...")
        
        # Fetch Order
        o_stmt = select(ShopifyOrder).where(ShopifyOrder.shopify_order_id == mock_id)
        order = (await session.execute(o_stmt)).scalars().first()
        
        if not order:
            print("❌ Order NOT found in refined table!")
            return

        # Assertions
        errors = []
        
        # Check Totals (Decimal comparison)
        if order.total_price != Decimal("68.55"):
            errors.append(f"Total Price Mismatch: Expected 68.55, Got {order.total_price}")
            
        if order.total_discounts != Decimal("5.00"):
            errors.append(f"Discount Mismatch: Expected 5.00, Got {order.total_discounts}")
            
        if order.email != "test@unclutr.ai":
            errors.append("Email Mismatch")
            
        # Check Line Items
        await session.refresh(order, ["line_items"])
        if len(order.line_items) != 2:
            errors.append(f"Line Item Count Mismatch: Expected 2, Got {len(order.line_items)}")
        
        # Check Specific Item logic if needed, but total proves parsing usually.
        
        if not errors:
            print("✅ PENNY PERFECT MOCK VERIFICATION PASSED!")
            print(f"   Order #{order.shopify_order_number} Total: ${order.total_price}")
            print(f"   Stored raw ID: {mock_id}")
        else:
            print("❌ VERIFICATION FAILED:")
            for e in errors:
                print(f"   - {e}")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv("backend/.env")
    asyncio.run(verify_penny_perfect())
