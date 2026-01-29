"""
Test script to demonstrate the overlapping window issue in VelocityGenerator.
Shows how the current implementation understates velocity changes.
"""
import asyncio
from datetime import date, timedelta
from sqlalchemy import select, func
from app.core.db import get_session
from app.models.shopify.metrics import ShopifyDailyMetric
from app.models.integration import Integration
from app.models.company import Workspace, Brand

async def test_overlapping_windows():
    """
    Demonstrates the statistical bias from overlapping time windows.
    """
    async for session in get_session():
        # Get first brand
        brand_stmt = select(Brand).limit(1)
        brand = (await session.execute(brand_stmt)).scalars().first()
        
        if not brand:
            print('No brand found')
            return
            
        print('='*80)
        print('OVERLAPPING WINDOW BIAS TEST')
        print('='*80)
        print(f'Brand: {brand.name}\n')
        
        today = date.today()
        
        # CURRENT IMPLEMENTATION (Overlapping)
        print('1️⃣  CURRENT IMPLEMENTATION (Overlapping Windows)')
        print('-' * 80)
        
        seven_days_ago = today - timedelta(days=7)
        thirty_days_ago = today - timedelta(days=30)
        
        stmt_7d = select(func.avg(ShopifyDailyMetric.total_sales)).join(
            Integration, ShopifyDailyMetric.integration_id == Integration.id
        ).join(
            Workspace, Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand.id,
            ShopifyDailyMetric.snapshot_date >= seven_days_ago
        )
        avg_7d_current = (await session.execute(stmt_7d)).scalar() or 0.0
        
        stmt_30d = select(func.avg(ShopifyDailyMetric.total_sales)).join(
            Integration, ShopifyDailyMetric.integration_id == Integration.id
        ).join(
            Workspace, Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand.id,
            ShopifyDailyMetric.snapshot_date >= thirty_days_ago
        )
        avg_30d_current = (await session.execute(stmt_30d)).scalar() or 0.0
        
        print(f'Last 7 days (days -7 to 0):  ${avg_7d_current:,.2f}/day')
        print(f'Last 30 days (days -30 to 0): ${avg_30d_current:,.2f}/day')
        
        if avg_30d_current > 0:
            diff_current = (float(avg_7d_current) - float(avg_30d_current)) / float(avg_30d_current)
            print(f'Change: {diff_current:+.1%}')
            print(f'Status: {"SHOWS" if abs(diff_current) >= 0.15 else "HIDDEN"} (threshold: 15%)')
        
        # CORRECTED IMPLEMENTATION (Non-overlapping)
        print('\n2️⃣  CORRECTED IMPLEMENTATION (Non-overlapping Windows)')
        print('-' * 80)
        
        # Last 7 complete days (excluding today)
        yesterday = today - timedelta(days=1)
        recent_start = yesterday - timedelta(days=6)
        
        # Previous 7 complete days
        previous_end = yesterday - timedelta(days=7)
        previous_start = yesterday - timedelta(days=13)
        
        stmt_recent = select(func.avg(ShopifyDailyMetric.total_sales)).join(
            Integration, ShopifyDailyMetric.integration_id == Integration.id
        ).join(
            Workspace, Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand.id,
            ShopifyDailyMetric.snapshot_date >= recent_start,
            ShopifyDailyMetric.snapshot_date <= yesterday
        )
        avg_recent = (await session.execute(stmt_recent)).scalar() or 0.0
        
        stmt_previous = select(func.avg(ShopifyDailyMetric.total_sales)).join(
            Integration, ShopifyDailyMetric.integration_id == Integration.id
        ).join(
            Workspace, Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand.id,
            ShopifyDailyMetric.snapshot_date >= previous_start,
            ShopifyDailyMetric.snapshot_date <= previous_end
        )
        avg_previous = (await session.execute(stmt_previous)).scalar() or 0.0
        
        print(f'Recent 7 days (days -7 to -1):   ${avg_recent:,.2f}/day')
        print(f'Previous 7 days (days -14 to -8): ${avg_previous:,.2f}/day')
        
        if avg_previous > 0:
            diff_corrected = (float(avg_recent) - float(avg_previous)) / float(avg_previous)
            print(f'Change: {diff_corrected:+.1%}')
            print(f'Status: {"SHOWS" if abs(diff_corrected) >= 0.15 else "HIDDEN"} (threshold: 15%)')
        
        # COMPARISON
        print('\n3️⃣  IMPACT ANALYSIS')
        print('-' * 80)
        
        if avg_30d_current > 0 and avg_previous > 0:
            sensitivity_loss = abs(diff_corrected) - abs(diff_current)
            print(f'Sensitivity Loss: {sensitivity_loss:.1%}')
            
            if sensitivity_loss > 0:
                print(f'⚠️  Current method UNDERSTATES change by {sensitivity_loss:.1%}')
                print(f'   This could cause missed insights!')
            elif sensitivity_loss < 0:
                print(f'⚠️  Current method OVERSTATES change by {abs(sensitivity_loss):.1%}')
            else:
                print(f'✅ Both methods produce identical results (rare)')
        
        # DATA COMPLETENESS CHECK
        print('\n4️⃣  DATA COMPLETENESS')
        print('-' * 80)
        
        count_7d = select(func.count(func.distinct(ShopifyDailyMetric.snapshot_date))).join(
            Integration, ShopifyDailyMetric.integration_id == Integration.id
        ).join(
            Workspace, Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand.id,
            ShopifyDailyMetric.snapshot_date >= seven_days_ago
        )
        days_7d = (await session.execute(count_7d)).scalar() or 0
        
        count_30d = select(func.count(func.distinct(ShopifyDailyMetric.snapshot_date))).join(
            Integration, ShopifyDailyMetric.integration_id == Integration.id
        ).join(
            Workspace, Integration.workspace_id == Workspace.id
        ).where(
            Workspace.brand_id == brand.id,
            ShopifyDailyMetric.snapshot_date >= thirty_days_ago
        )
        days_30d = (await session.execute(count_30d)).scalar() or 0
        
        print(f'Days of data (last 7):  {days_7d}/7 expected')
        print(f'Days of data (last 30): {days_30d}/30 expected')
        
        if days_7d < 7 or days_30d < 30:
            print(f'⚠️  INSUFFICIENT DATA - Insight should be hidden')
        else:
            print(f'✅ Sufficient data for reliable insight')
        
        print('\n' + '='*80)
        print('CONCLUSION')
        print('='*80)
        print('The overlapping window issue causes the velocity calculation to be')
        print('less sensitive to recent changes, potentially missing important trends.')
        print('\nRecommendation: Use week-over-week comparison (non-overlapping windows)')
        
        break

if __name__ == "__main__":
    asyncio.run(test_overlapping_windows())
