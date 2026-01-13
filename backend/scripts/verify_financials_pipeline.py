import asyncio
import logging
import sys
from unittest.mock import MagicMock, AsyncMock, patch
from uuid import uuid4
from datetime import datetime
from sqlmodel import select
from app.core.db import async_session_factory
from app.models.integration import Integration
from app.services.shopify.sync_service import shopify_sync_service
from app.services.shopify.refinement_service import shopify_refinement_service
from app.models.shopify.financials import ShopifyPayout, ShopifyDispute

# Setup Logging
logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger("verify_financials")

async def main():
    logger.info("🧪 Starting Mock Verification for Financial Sync...")
    
    # Mock Token
    with patch("app.services.shopify.oauth_service.shopify_oauth_service.get_access_token", new_callable=AsyncMock) as mock_token:
        mock_token.return_value = "fake_token"
        
        # Mock HTTP Responses
        async def mock_get_side_effect(*args, **kwargs):
            url = args[0] if args else kwargs.get("url")
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.headers = {}
            
            if "payouts.json" in str(url):
                mock_resp.json.return_value = {
                    "payouts": [
                        {
                            "id": 1001,
                            "status": "paid",
                            "date": "2024-01-10",
                            "currency": "USD",
                            "amount": "100.00",
                            "summary": {"charges_fee_amount": "2.00", "charges_gross_amount": "102.00"}
                        }
                    ]
                }
            elif "disputes.json" in str(url):
                 mock_resp.json.return_value = {
                    "disputes": [
                        {
                            "id": 2001,
                            "order_id": 5001,
                            "type": "chargeback",
                            "amount": "50.00",
                            "currency": "USD",
                            "reason": "fraudulent",
                            "status": "needs_response",
                            "evidence_due_by": "2024-01-20T12:00:00Z"
                        }
                    ]
                }
            else:
                mock_resp.json.return_value = {}
                
            return mock_resp

        # Mock Client
        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            mock_get.side_effect = mock_get_side_effect
            
            async with async_session_factory() as session:
                # 1. Use Existing Integration
                stmt = select(Integration).limit(1)
                integration = (await session.exec(stmt)).first()
                if not integration:
                     logger.error("No integration found.")
                     return

                logger.info(f"Using Integration: {integration.id}")
                
                # Mock metadata
                integration.metadata_info = {"shop": "mock-shop.myshopify.com"}
                session.add(integration)
                await session.flush()
                
                # 2. Sync Payouts
                logger.info("🚀 Syncing Payouts...")
                p_stats = await shopify_sync_service.fetch_and_ingest_payouts(session, integration.id)
                logger.info(f"Payout Stats: {p_stats}")
                assert p_stats["ingested"] == 1
                
                # 3. Sync Disputes
                logger.info("🚀 Syncing Disputes...")
                d_stats = await shopify_sync_service.fetch_and_ingest_disputes(session, integration.id)
                logger.info(f"Dispute Stats: {d_stats}")
                assert d_stats["ingested"] == 1
                
                await session.flush()
                
                # 4. Refine
                logger.info("⚙️  Refining...")
                count = await shopify_refinement_service.process_pending_records(session, integration.id, limit=50)
                logger.info(f"Refined {count} records.")
                assert count >= 2
                
                await session.flush()
                
                # 5. Verify DB
                payouts = (await session.exec(select(ShopifyPayout).where(ShopifyPayout.integration_id == integration.id))).all()
                disputes = (await session.exec(select(ShopifyDispute).where(ShopifyDispute.integration_id == integration.id))).all()
                
                logger.info(f"Payouts in DB: {len(payouts)}")
                logger.info(f"Disputes in DB: {len(disputes)}")
                
                assert len(payouts) >= 1
                assert len(disputes) >= 1
                assert payouts[0].amount == 100.00
                assert disputes[0].reason == "fraudulent"
                
                logger.info("✅ Verification Passed!")
                await session.rollback()

if __name__ == "__main__":
    asyncio.run(main())
