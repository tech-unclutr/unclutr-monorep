"""
Cleanup script to remove duplicate datasources and standardize "Not Applicable" names.
"""
import asyncio
import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.models.datasource import DataSource

# Local session factory
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def cleanup_datasources():
    """Remove duplicate entries and standardize Not Applicable names."""
    
    async with async_session_maker() as session:
        print("🧹 Starting datasource cleanup...")
        print("=" * 80)
        
        # Count before
        result = await session.exec(select(DataSource))
        before_count = len(result.all())
        print(f"Total datasources before cleanup: {before_count}")
        print()
        
        # 1. Delete duplicate entries (keeping Flipkart Minutes as requested)
        duplicates_to_delete = [
            'aftership_returns',
            'amazon_in',
            'cashfree_payouts',
            'delhivery_fulfillment',
            'shiprocket_fulfillment',
        ]
        
        print("🗑️  Deleting duplicate entries...")
        deleted_count = 0
        for slug in duplicates_to_delete:
            result = await session.exec(select(DataSource).where(DataSource.slug == slug))
            ds = result.first()
            if ds:
                print(f"  ✓ Deleting: {ds.name} ({slug})")
                await session.delete(ds)
                deleted_count += 1
            else:
                print(f"  ⚠ Not found: {slug}")
        
        print()
        
        # 2. Rename "Not Applicable" entries for consistency
        print("📝 Standardizing 'Not Applicable' names...")
        
        renames = {
            'analytics_crm_not_applicable': {
                'name': 'Analytics - Not Applicable',
                'slug': 'analytics_not_applicable'
            },
            'payment_not_applicable': {
                'name': 'Payment - Not Applicable',
                'slug': 'payment_not_applicable'
            }
        }
        
        renamed_count = 0
        for old_slug, new_data in renames.items():
            result = await session.exec(select(DataSource).where(DataSource.slug == old_slug))
            ds = result.first()
            if ds:
                old_name = ds.name
                ds.name = new_data['name']
                ds.slug = new_data['slug']
                session.add(ds)
                print(f"  ✓ Renamed: '{old_name}' → '{ds.name}' ({ds.slug})")
                renamed_count += 1
            else:
                print(f"  ⚠ Not found: {old_slug}")
        
        print()
        
        # Commit changes
        await session.commit()
        print("💾 Changes committed to database")
        print()
        
        # Count after
        result = await session.exec(select(DataSource))
        after_count = len(result.all())
        
        print("=" * 80)
        print("✅ CLEANUP COMPLETE")
        print(f"Total datasources before: {before_count}")
        print(f"Total datasources after:  {after_count}")
        print(f"Entries deleted:          {deleted_count}")
        print(f"Entries renamed:          {renamed_count}")
        print(f"Expected final count:     144 (149 - 5 duplicates)")
        print(f"Match: {'✅ YES' if after_count == 144 else '❌ NO'}")

if __name__ == "__main__":
    asyncio.run(cleanup_datasources())
