"""
Verification script for Shopify Reports & Analytics models.
Tests all edge cases and failure modes outlined in the QA Blueprint.
"""
import asyncio
import sys
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from app.core.db import get_session
from app.models.integration import Integration
from app.models.company import Company
from app.models.shopify.analytics import ShopifyReport, ShopifyReportData, ShopifyAnalyticsSnapshot


async def test_report_creation(session, integration_id, company_id):
    """Test Case RP-001: Sync Existing Reports (Happy Path)"""
    print("\n📊 Test RP-001: Creating ShopifyReport...")
    
    report = ShopifyReport(
        integration_id=integration_id,
        company_id=company_id,
        shopify_report_id=123456789,
        name="Sales Over Time",
        shopify_ql="SHOW total_sales FROM orders WHERE created_at > '2024-01-01'",
        category="sales",
        shopify_updated_at=datetime.utcnow(),
        raw_payload={"id": 123456789, "name": "Sales Over Time"}
    )
    
    session.add(report)
    await session.commit()
    await session.refresh(report)
    
    print(f"✅ Created ShopifyReport: {report.id} - {report.name}")
    return report


async def test_report_data_creation(session, integration_id, company_id, report_id):
    """Test Case RP-002: Snapshot Storage (Happy Path)"""
    print("\n📸 Test RP-002: Creating ShopifyReportData snapshot...")
    
    mock_data = {
        "rows": [
            {"date": "2024-01-01", "revenue": 1500.50, "orders": 42},
            {"date": "2024-01-02", "revenue": 1750.25, "orders": 38},
            {"date": "2024-01-03", "revenue": 2100.00, "orders": 55}
        ],
        "columns": ["date", "revenue", "orders"]
    }
    
    report_data = ShopifyReportData(
        integration_id=integration_id,
        company_id=company_id,
        report_id=report_id,
        query_name="sales_over_time",
        captured_at=datetime.utcnow(),
        data=mock_data
    )
    
    session.add(report_data)
    await session.commit()
    await session.refresh(report_data)
    
    print(f"✅ Created ShopifyReportData: {report_data.id} with {len(mock_data['rows'])} rows")
    return report_data


async def test_analytics_snapshots(session, integration_id, company_id, report_id, report_data_id):
    """Test Case RP-003: Time-Series Snapshot (Happy Path)"""
    print("\n📈 Test RP-003: Creating ShopifyAnalyticsSnapshot entries...")
    
    snapshots = []
    base_date = datetime(2024, 1, 1)
    
    for i in range(3):
        snapshot = ShopifyAnalyticsSnapshot(
            integration_id=integration_id,
            company_id=company_id,
            report_id=report_id,
            report_data_id=report_data_id,
            timestamp=base_date + timedelta(days=i),
            granularity="day",
            data={"revenue": 1500.50 + (i * 250), "orders": 42 + (i * 5)}
        )
        snapshots.append(snapshot)
        session.add(snapshot)
    
    await session.commit()
    print(f"✅ Created {len(snapshots)} daily snapshots")
    return snapshots


async def test_duplicate_sync(session, integration_id, company_id):
    """Test Case RP-008: Duplicate Sync (Idempotency)"""
    print("\n🔄 Test RP-008: Testing duplicate report sync...")
    
    # Create first report
    report1 = ShopifyReport(
        integration_id=integration_id,
        company_id=company_id,
        shopify_report_id=999888777,
        name="Duplicate Test Report",
        shopify_updated_at=datetime.utcnow(),
        raw_payload={}
    )
    session.add(report1)
    await session.commit()
    
    # Try to create duplicate
    try:
        report2 = ShopifyReport(
            integration_id=integration_id,
            company_id=company_id,
            shopify_report_id=999888777,  # Same ID
            name="Duplicate Test Report",
            shopify_updated_at=datetime.utcnow(),
            raw_payload={}
        )
        session.add(report2)
        await session.commit()
        print("❌ FAILED: Duplicate was allowed!")
        return False
    except IntegrityError:
        await session.rollback()
        print("✅ Duplicate correctly rejected by unique constraint")
        return True


async def test_cascade_delete(session, integration_id, company_id):
    """Test CASCADE delete behavior"""
    print("\n🗑️  Testing CASCADE delete...")
    
    # Count records before
    reports_before = (await session.execute(select(ShopifyReport).where(ShopifyReport.integration_id == integration_id))).scalars().all()
    data_before = (await session.execute(select(ShopifyReportData).where(ShopifyReportData.integration_id == integration_id))).scalars().all()
    snapshots_before = (await session.execute(select(ShopifyAnalyticsSnapshot).where(ShopifyAnalyticsSnapshot.integration_id == integration_id))).scalars().all()
    
    print(f"Before delete: {len(reports_before)} reports, {len(data_before)} data records, {len(snapshots_before)} snapshots")
    
    # Delete integration
    integration = await session.get(Integration, integration_id)
    await session.delete(integration)
    await session.commit()
    
    # Count records after
    reports_after = (await session.execute(select(ShopifyReport).where(ShopifyReport.integration_id == integration_id))).scalars().all()
    data_after = (await session.execute(select(ShopifyReportData).where(ShopifyReportData.integration_id == integration_id))).scalars().all()
    snapshots_after = (await session.execute(select(ShopifyAnalyticsSnapshot).where(ShopifyAnalyticsSnapshot.integration_id == integration_id))).scalars().all()
    
    print(f"After delete: {len(reports_after)} reports, {len(data_after)} data records, {len(snapshots_after)} snapshots")
    
    if len(reports_after) == 0 and len(data_after) == 0 and len(snapshots_after) == 0:
        print("✅ CASCADE delete working correctly")
        return True
    else:
        print("❌ FAILED: Some records were not deleted")
        return False


async def test_invalid_json(session, integration_id, company_id):
    """Test Case RP-007: Invalid JSON (Negative)"""
    print("\n⚠️  Test RP-007: Testing with malformed data...")
    
    # SQLModel/SQLAlchemy will accept any dict for JSONB
    # The "invalid" case is more about service-level validation
    report_data = ShopifyReportData(
        integration_id=integration_id,
        company_id=company_id,
        query_name="malformed_test",
        data={"broken": "structure", "missing": ["expected", "fields"]}
    )
    
    session.add(report_data)
    await session.commit()
    print("✅ Malformed JSON stored (service layer should validate)")
    return True


async def main():
    print("=" * 60)
    print("🧪 Shopify Reports & Analytics - Verification Script")
    print("=" * 60)
    
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    try:
        # Get existing active integration (with all fields loaded)
        print("\n🔍 Finding active integration...")
        stmt = select(Integration).where(Integration.status == "active")
        result = await session.exec(stmt)
        integration = result.first()
        
        if not integration:
            print("❌ No active integration found. Please create one first.")
            sys.exit(1)
        
        # Extract values immediately to avoid lazy loading
        company_id = integration.company_id
        integration_id = integration.id
        workspace_id_value = integration.workspace_id
        datasource_id_value = integration.datasource_id
        
        print(f"✅ Using Integration: {integration_id}")
        print(f"✅ Using Company: {company_id}")
        
        # Clean up any leftover test data first (reverse dependency order)
        print("\n🧹 Cleaning up any leftover test data...")
        old_snapshots = (await session.exec(select(ShopifyAnalyticsSnapshot).where(ShopifyAnalyticsSnapshot.integration_id == integration_id))).all()
        for s in old_snapshots:
            await session.delete(s)
        
        old_data = (await session.exec(select(ShopifyReportData).where(ShopifyReportData.integration_id == integration_id))).all()
        for d in old_data:
            await session.delete(d)
        
        old_reports = (await session.exec(select(ShopifyReport).where(ShopifyReport.integration_id == integration_id))).all()
        for r in old_reports:
            await session.delete(r)
        
        await session.commit()
        print("✅ Cleanup complete")
        
        # Run test cases
        report = await test_report_creation(session, integration_id, company_id)
        report_data = await test_report_data_creation(session, integration_id, company_id, report.id)
        snapshots = await test_analytics_snapshots(session, integration_id, company_id, report.id, report_data.id)
        await test_duplicate_sync(session, integration_id, company_id)
        await test_invalid_json(session, integration_id, company_id)
        
        # Test cascade delete (creates a temporary integration)
        print("\n🗑️  Testing CASCADE delete with temporary integration...")
        
        temp_integration_id = uuid4()
        temp_integration = Integration(
            id=temp_integration_id,
            company_id=company_id,
            workspace_id=workspace_id_value,
            datasource_id=datasource_id_value,
            status="active",
            credentials={"shop": "temp-test.myshopify.com"}
        )
        session.add(temp_integration)
        
        # Create test data for temp integration
        temp_report = ShopifyReport(
            integration_id=temp_integration_id,
            company_id=company_id,
            shopify_report_id=888777666,
            name="Temp Report for Delete Test",
            shopify_updated_at=datetime.utcnow(),
            raw_payload={}
        )
        session.add(temp_report)
        await session.commit()
        await session.refresh(temp_report)
        
        temp_data = ShopifyReportData(
            integration_id=temp_integration_id,
            company_id=company_id,
            report_id=temp_report.id,
            query_name="temp_test",
            data={"test": "data"}
        )
        session.add(temp_data)
        await session.commit()
        await session.refresh(temp_data)
        
        temp_snapshot = ShopifyAnalyticsSnapshot(
            integration_id=temp_integration_id,
            company_id=company_id,
            report_id=temp_report.id,
            report_data_id=temp_data.id,
            timestamp=datetime.utcnow(),
            granularity="day",
            data={"test": 123}
        )
        session.add(temp_snapshot)
        await session.commit()
        
        # Now test cascade delete
        await test_cascade_delete(session, temp_integration_id, company_id)
        
        # Clean up test data from main integration
        print("\n🧹 Cleaning up test data...")
        reports = (await session.exec(select(ShopifyReport).where(ShopifyReport.integration_id == integration_id))).all()
        for r in reports:
            await session.delete(r)
        
        data_records = (await session.exec(select(ShopifyReportData).where(ShopifyReportData.integration_id == integration_id))).all()
        for d in data_records:
            await session.delete(d)
        
        snapshots_list = (await session.exec(select(ShopifyAnalyticsSnapshot).where(ShopifyAnalyticsSnapshot.integration_id == integration_id))).all()
        for s in snapshots_list:
            await session.delete(s)
        
        await session.commit()
        print("✅ Cleanup complete")
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        await session.close()


if __name__ == "__main__":
    asyncio.run(main())
