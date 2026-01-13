"""
End-to-End Verification Script for Shopify Analytics Sync

This script tests the complete analytics sync flow:
1. Mock report metadata creation
2. Mock ShopifyQL query execution
3. Report data ingestion and refinement
4. Analytics snapshot generation
5. Idempotency and cascade delete verification
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import async_session_factory
from app.models.integration import Integration
from app.models.company import Company
from app.models.datasource import DataSource
from app.models.shopify.analytics import ShopifyReport, ShopifyReportData, ShopifyAnalyticsSnapshot
from app.models.shopify.raw_ingest import ShopifyRawIngest
from app.services.shopify.refinement_service import shopify_refinement_service
from loguru import logger

async def cleanup_test_data(session: AsyncSession, integration_id):
    """Clean up test data"""
    # Delete analytics snapshots
    stmt = select(ShopifyAnalyticsSnapshot).where(
        ShopifyAnalyticsSnapshot.integration_id == integration_id
    )
    snapshots = (await session.execute(stmt)).scalars().all()
    for s in snapshots:
        await session.delete(s)
    
    # Delete report data
    stmt = select(ShopifyReportData).where(
        ShopifyReportData.integration_id == integration_id
    )
    report_data = (await session.execute(stmt)).scalars().all()
    for rd in report_data:
        await session.delete(rd)
    
    # Delete reports
    stmt = select(ShopifyReport).where(
        ShopifyReport.integration_id == integration_id
    )
    reports = (await session.execute(stmt)).scalars().all()
    for r in reports:
        await session.delete(r)
    
    # Delete raw ingest
    stmt = select(ShopifyRawIngest).where(
        ShopifyRawIngest.integration_id == integration_id,
        ShopifyRawIngest.object_type.in_(["report", "report_data"])
    )
    raw_records = (await session.execute(stmt)).scalars().all()
    for r in raw_records:
        await session.delete(r)
    
    await session.commit()
    logger.info("✅ Cleanup complete")

async def test_analytics_sync():
    """Main test function"""
    async with async_session_factory() as session:
        logger.info("🧪 Starting Analytics Sync Verification")
        
        # 1. Get or create test integration
        stmt = select(Integration).limit(1)
        integration = (await session.execute(stmt)).scalars().first()
        
        if not integration:
            logger.error("❌ No integration found. Please create one first.")
            return
        
        integration_id = integration.id
        company_id = integration.company_id
        
        # Cache IDs to avoid lazy loading
        workspace_id = integration.workspace_id
        datasource_id = integration.datasource_id
        
        logger.info(f"Using integration: {integration_id}")
        
        # Cleanup previous test data
        await cleanup_test_data(session, integration_id)
        
        # 2. Create mock report metadata
        logger.info("📊 Creating mock report metadata...")
        report = ShopifyReport(
            integration_id=integration_id,
            company_id=company_id,
            shopify_report_id=999999,
            name="Test Sales Report",
            shopify_ql="FROM sales GROUP BY day",
            category="sales",
            shopify_updated_at=datetime.utcnow(),
            raw_payload={"id": 999999, "name": "Test Sales Report"},
            created_by="test_script",
            updated_by="test_script"
        )
        session.add(report)
        await session.commit()
        await session.refresh(report)
        logger.info(f"✅ Created report: {report.id}")
        
        # 3. Create mock ShopifyQL result
        logger.info("📈 Creating mock ShopifyQL result...")
        mock_result = {
            "rows": [
                {
                    "day": "2024-01-15",
                    "gross_sales": "1500.50",
                    "net_sales": "1400.00",
                    "orders_count": "42",
                    "returns": "100.50"
                },
                {
                    "day": "2024-01-16",
                    "gross_sales": "2200.75",
                    "net_sales": "2100.00",
                    "orders_count": "58",
                    "returns": "100.75"
                },
                {
                    "day": "2024-01-17",
                    "gross_sales": "1800.25",
                    "net_sales": "1750.00",
                    "orders_count": "50",
                    "returns": "50.25"
                }
            ]
        }
        
        # 4. Ingest as raw report_data
        logger.info("💾 Ingesting mock report data...")
        raw_ingest = ShopifyRawIngest(
            integration_id=integration_id,
            company_id=company_id,
            workspace_id=workspace_id,
            datasource_id=datasource_id,
            object_type="report_data",
            payload={
                "report_id": str(report.id),
                "report_name": report.name,
                "query": report.shopify_ql,
                "result": mock_result
            },
            topic="analytics/report/Test Sales Report",
            dedupe_key=f"report_data_{report.id}_{datetime.utcnow().isoformat()}",
            dedupe_hash_canonical=str(uuid4()),
            processing_status="pending",
            created_by="test_script"
        )
        session.add(raw_ingest)
        await session.commit()
        logger.info(f"✅ Created raw ingest: {raw_ingest.id}")
        
        # 5. Process refinement
        logger.info("⚙️ Running refinement service...")
        processed = await shopify_refinement_service.process_pending_records(
            session, 
            integration_id=integration_id,
            limit=10
        )
        await session.commit()
        logger.info(f"✅ Processed {processed} records")
        
        # 6. Verify ShopifyReportData was created
        logger.info("🔍 Verifying ShopifyReportData...")
        stmt = select(ShopifyReportData).where(
            ShopifyReportData.integration_id == integration_id,
            ShopifyReportData.query_name == report.name
        )
        report_data = (await session.execute(stmt)).scalars().first()
        
        if not report_data:
            logger.error("❌ ShopifyReportData not created!")
            return
        
        logger.info(f"✅ ShopifyReportData created: {report_data.id}")
        logger.info(f"   - Query: {report_data.query_name}")
        logger.info(f"   - Captured: {report_data.captured_at}")
        logger.info(f"   - Rows: {len(report_data.data.get('rows', []))}")
        
        # 7. Verify ShopifyAnalyticsSnapshot records
        logger.info("🔍 Verifying ShopifyAnalyticsSnapshot records...")
        stmt = select(ShopifyAnalyticsSnapshot).where(
            ShopifyAnalyticsSnapshot.integration_id == integration_id,
            ShopifyAnalyticsSnapshot.report_data_id == report_data.id
        )
        snapshots = (await session.execute(stmt)).scalars().all()
        
        if len(snapshots) != 3:
            logger.error(f"❌ Expected 3 snapshots, got {len(snapshots)}")
            return
        
        logger.info(f"✅ Created {len(snapshots)} analytics snapshots")
        for snapshot in snapshots:
            logger.info(f"   - {snapshot.timestamp.date()} ({snapshot.granularity}): {snapshot.data}")
        
        # 8. Test idempotency - run refinement again
        logger.info("🔁 Testing idempotency...")
        raw_ingest.processing_status = "pending"
        session.add(raw_ingest)
        await session.commit()
        
        processed = await shopify_refinement_service.process_pending_records(
            session,
            integration_id=integration_id,
            limit=10
        )
        await session.commit()
        
        # Count snapshots again
        stmt = select(ShopifyAnalyticsSnapshot).where(
            ShopifyAnalyticsSnapshot.integration_id == integration_id,
            ShopifyAnalyticsSnapshot.report_data_id == report_data.id
        )
        snapshots_after = (await session.execute(stmt)).scalars().all()
        
        if len(snapshots_after) != 3:
            logger.error(f"❌ Idempotency failed! Expected 3 snapshots, got {len(snapshots_after)}")
            return
        
        logger.info("✅ Idempotency verified - no duplicates created")
        
        # 9. Test cascade deletes
        logger.info("🗑️ Testing cascade deletes...")
        await session.delete(report)
        await session.commit()
    
    # 9b. Verify in a fresh session to avoid cache
    async with async_session_factory() as verify_session:
        logger.info("🔍 Verifying cascade deletion in fresh session...")
        
        # Verify all related records deleted
        stmt = select(ShopifyReportData).where(ShopifyReportData.id == report_data.id)
        deleted_report_data = (await verify_session.execute(stmt)).scalars().first()
        
        stmt = select(ShopifyAnalyticsSnapshot).where(
            ShopifyAnalyticsSnapshot.report_data_id == report_data.id
        )
        deleted_snapshots = (await verify_session.execute(stmt)).scalars().all()
        
        if deleted_report_data or deleted_snapshots:
            logger.error(f"❌ Cascade delete failed! Found data: {deleted_report_data}, {deleted_snapshots}")
            return
        
        logger.info("✅ Cascade delete verified - all related records removed")
        
        # 10. Summary
        logger.info("\n" + "="*60)
        logger.info("🎉 ALL TESTS PASSED!")
        logger.info("="*60)
        logger.info("✅ Report metadata creation")
        logger.info("✅ Report data ingestion and refinement")
        logger.info("✅ Analytics snapshot generation (3 snapshots)")
        logger.info("✅ Idempotency (no duplicates on re-run)")
        logger.info("✅ Cascade deletes (all related records removed)")
        logger.info("="*60)

if __name__ == "__main__":
    asyncio.run(test_analytics_sync())
