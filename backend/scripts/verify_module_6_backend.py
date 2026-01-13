import asyncio
import sys
import os
from datetime import date, timedelta
from sqlmodel import select, func

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import selectinload
from app.core.db import get_session
from app.models.integration import Integration
from app.models.integration_analytics import IntegrationDailyMetric
from app.services.analytics.service import AnalyticsService

async def verify_module_6_generic():
    print("🚀 Verifying Module 6: Polymorphic Analytics Architecture...")
    
    async for session in get_session():
        # 1. Find an active Shopify integration (with eager loading)
        stmt = select(Integration).where(Integration.status == "active").options(selectinload(Integration.datasource))
        result = await session.execute(stmt)
        integration = result.scalars().first()
        
        if not integration:
            print("❌ No active integration found. Please link a Shopify store first.")
            return

        print(f"✅ Found active integration: {integration.id} ({integration.datasource.slug})")

        # 2. Trigger Unified Metrics Generation for last 7 days
        print(f"📊 Generating metrics snapshots using AnalyticsService...")
        today = date.today()
        for i in range(7):
            target_date = today - timedelta(days=i)
            try:
                await AnalyticsService.refresh_snapshot(session, integration, target_date)
            except Exception as e:
                print(f"❌ Failed for {target_date}: {e}")
        
        await session.commit()
        print("✅ Historical snapshots generated in generic table.")

        # 3. Verify Database Persistence in generic table
        stmt = select(func.count(IntegrationDailyMetric.id)).where(
            IntegrationDailyMetric.integration_id == integration.id
        )
        count = (await session.execute(stmt)).scalar()
        if count >= 7:
            print(f"✅ Verified: Found {count} snapshots in integration_daily_metric.")
        else:
            print(f"❌ Error: Expected 7 snapshots, found {count}.")

        # 4. Check API Logic (Overview Aggregation)
        print("🔍 Testing Overview Aggregation Logic...")
        overview = await AnalyticsService.get_overview(session, integration)
        
        if overview["summary"]["total_sales_30d"] >= 0:
            print(f"✅ Overview Success: Total Sales (30d) = {overview['summary']['total_sales_30d']}")
            print(f"✅ Order Count (30d) = {overview['summary']['order_count_30d']}")
        else:
            print("❌ Overview logic returned invalid summary.")

        print("\n🎉 Module 6 (15/10 Refactor) Verification Complete!")
        break

if __name__ == "__main__":
    asyncio.run(verify_module_6_generic())
