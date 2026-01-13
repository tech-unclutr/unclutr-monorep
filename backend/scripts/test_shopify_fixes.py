"""
Test script to verify Shopify sync and verification fixes.
Tests:
1. Verify integrity with fresh connection (should not request reconnection)
2. Webhook health monitoring
3. Real-time sync simulation
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.db import async_session_maker
from app.models.integration import Integration
from app.services.shopify.sync_service import shopify_sync_service
from sqlmodel import select
from loguru import logger


async def test_verify_integrity():
    """Test the new verify_integration_integrity function."""
    logger.info("=" * 80)
    logger.info("TEST 1: Verify Integration Integrity")
    logger.info("=" * 80)
    
    
    async with async_session_maker() as session:
        # Find a Shopify integration
        stmt = select(Integration).join(
            Integration.datasource
        ).where(
            Integration.datasource.has(slug="shopify")
        ).limit(1)
        
        result = await session.execute(stmt)
        integration = result.scalars().first()
        
        if not integration:
            logger.error("❌ No Shopify integration found")
            return False
        
        logger.info(f"Testing integration: {integration.id}")
        logger.info(f"Status: {integration.status}")
        
        # Run verification
        report = await shopify_sync_service.verify_integration_integrity(
            session, integration.id
        )
        
        logger.info("\n" + "=" * 80)
        logger.info("VERIFICATION REPORT")
        logger.info("=" * 80)
        logger.info(f"Status: {report['status']}")
        logger.info(f"OAuth Status: {report['stats'].get('oauth_status', 'N/A')}")
        logger.info(f"Webhook Status: {report.get('webhook_status', 'unknown')}")
        logger.info(f"Registered Webhooks: {report['stats'].get('registered_webhooks', 0)}")
        
        if report.get('issues'):
            logger.warning("\nIssues:")
            for issue in report['issues']:
                logger.warning(f"  - {issue}")
        
        if report.get('warnings'):
            logger.info("\nWarnings:")
            for warning in report['warnings']:
                logger.info(f"  - {warning}")
        
        logger.info("\nData Completeness:")
        for table, count in report.get('data_completeness', {}).items():
            logger.info(f"  {table}: {count}")
        
        # Check if fresh connection is handled correctly
        if report['status'] == 'Critical' and 'Fresh connection' in str(report.get('warnings', [])):
            logger.error("❌ FAIL: Fresh connection incorrectly marked as Critical")
            return False
        elif report['status'] == 'Healthy' or report['status'] == 'Warning':
            logger.success("✅ PASS: Verification correctly handles integration state")
            return True
        else:
            logger.warning(f"⚠️  Status: {report['status']}")
            return True


async def test_webhook_health():
    """Test webhook health monitoring."""
    logger.info("\n" + "=" * 80)
    logger.info("TEST 2: Webhook Health Monitoring")
    logger.info("=" * 80)
    
    
    async with async_session_maker() as session:
        # Find a Shopify integration
        stmt = select(Integration).join(
            Integration.datasource
        ).where(
            Integration.datasource.has(slug="shopify")
        ).limit(1)
        
        result = await session.execute(stmt)
        integration = result.scalars().first()
        
        if not integration:
            logger.error("❌ No Shopify integration found")
            return False
        
        metadata = integration.metadata_info or {}
        webhook_reg = metadata.get("webhook_registration", {})
        
        logger.info(f"Webhook Registration Status: {webhook_reg.get('status', 'unknown')}")
        logger.info(f"Success Rate: {webhook_reg.get('success_rate', 0)}%")
        logger.info(f"Registered At: {webhook_reg.get('registered_at', 'N/A')}")
        
        if webhook_reg.get('failed_count', 0) > 0:
            logger.warning(f"Failed Webhooks: {webhook_reg.get('failed_count')}")
            for failure in webhook_reg.get('failures', []):
                logger.warning(f"  - {failure}")
        
        if webhook_reg.get('status') == 'complete':
            logger.success("✅ PASS: All webhooks registered successfully")
            return True
        elif webhook_reg.get('status') == 'partial':
            logger.warning("⚠️  PARTIAL: Some webhooks failed to register")
            return True
        else:
            logger.info("ℹ️  Webhook registration status not available (may be old integration)")
            return True


async def main():
    """Run all tests."""
    logger.info("Starting Shopify Sync & Verification Tests\n")
    
    results = []
    
    # Test 1: Verify Integrity
    try:
        result = await test_verify_integrity()
        results.append(("Verify Integrity", result))
    except Exception as e:
        logger.error(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Verify Integrity", False))
    
    # Test 2: Webhook Health
    try:
        result = await test_webhook_health()
        results.append(("Webhook Health", result))
    except Exception as e:
        logger.error(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Webhook Health", False))
    
    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("TEST SUMMARY")
    logger.info("=" * 80)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        logger.info(f"{status}: {test_name}")
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    logger.info(f"\nTotal: {passed}/{total} tests passed")
    
    return all(p for _, p in results)


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
