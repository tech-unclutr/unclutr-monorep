import asyncio
import logging
import sys
from unittest.mock import MagicMock, AsyncMock, patch
from uuid import uuid4
from sqlmodel import select
from app.core.db import async_session_factory
from app.models.integration import Integration
from app.services.shopify.sync_service import shopify_sync_service
from app.services.shopify.refinement_service import shopify_refinement_service
from app.models.shopify.analytics import ShopifyReport

# Setup Logging
logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger("trigger_report_sync_mock")

async def main():
    logger.info("🧪 Starting Mock Verification for Report Sync...")
    
    # Mock Token
    with patch("app.services.shopify.oauth_service.shopify_oauth_service.get_access_token", new_callable=AsyncMock) as mock_token:
        mock_token.return_value = "fake_token"
        
        # Mock HTTP Response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "reports": [
                {
                    "id": 123456789,
                    "name": "Sales over time",
                    "shopify_ql": "SHOW total_sales BY month FROM sales",
                    "category": "sales",
                    "updated_at": "2024-01-01T12:00:00Z"
                },
                {
                    "id": 987654321,
                    "name": "Acquisition Report",
                    "shopify_ql": "SHOW visits BY referrer FROM visits",
                    "category": "acquisition",
                    "updated_at": "2024-01-02T12:00:00Z"
                }
            ]
        }
        mock_response.headers = {}

        # Mock Client
        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response
            
            async with async_session_factory() as session:
                # 1. Use Existing Integration and Mock Metadata
                stmt = select(Integration).limit(1)
                integration = (await session.exec(stmt)).first()
                
                if not integration:
                     logger.error("No integration found in DB to attach to. Cannot run test.")
                     return

                logger.info(f"Using Integration: {integration.id}")
                
                # Mock metadata for the test
                # We update it in this transaction, it will be rolled back
                integration.metadata_info = {"shop": "mock-shop.myshopify.com"}
                session.add(integration)
                await session.flush()
                
                integration_id = integration.id
                
                # 2. Run Sync
                logger.info("🚀 Calling fetch_and_ingest_reports...")
                stats = await shopify_sync_service.fetch_and_ingest_reports(session, integration_id)
                logger.info(f"Stats: {stats}")
                
                assert stats["ingested"] == 2
                assert stats["errors"] == 0
                
                await session.flush()
                
                # 3. Trigger Refinement
                logger.info("⚙️  Refining...")
                count = await shopify_refinement_service.process_pending_records(session, integration.id, limit=10)
                logger.info(f"Refined {count} records.")
                assert count == 2
                
                await session.flush()
                
                # 4. Verify DB
                stmt = select(ShopifyReport).where(ShopifyReport.integration_id == integration.id)
                reports = (await session.execute(stmt)).scalars().all()
                
                logger.info(f"Found {len(reports)} reports in DB:")
                for r in reports:
                    logger.info(f"  - {r.name} (ID: {r.shopify_report_id}) | QL: {r.shopify_ql}")
                    
                assert len(reports) >= 2
                found_sales = any(r.shopify_report_id == 123456789 for r in reports)
                assert found_sales
                
                logger.info("✅ Verification Passed!")
                # Rollback to keep DB clean
                await session.rollback()

if __name__ == "__main__":
    asyncio.run(main())
