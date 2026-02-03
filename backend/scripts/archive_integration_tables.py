#!/usr/bin/env python3
"""
Archive/Restore Integration and Shopify tables by renaming them.

This script renames tables with an '_archived' suffix to hide them from
the active tables list, while preserving all data for easy restoration.

Usage:
    python3 archive_integration_tables.py archive   # Hide tables
    python3 archive_integration_tables.py restore   # Restore tables
"""

import asyncio
import sys
import os
import argparse
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import get_session

# Define all tables to archive
# Order matters for dependencies - child tables first
TABLES_TO_ARCHIVE = [
    # Shopify child tables
    "shopify_address",
    "shopify_analytics_snapshot",
    "shopify_report_data",
    "shopify_report",
    "shopify_checkout",
    "shopify_customer",
    "shopify_discount_code",
    "shopify_price_rule",
    "shopify_balance_transaction",
    "shopify_payout",
    "shopify_dispute",
    "shopify_fulfillment",
    "shopify_inventory_level",
    "shopify_inventory_item",
    "shopify_location",
    "shopify_marketing_event",
    "shopify_daily_metric",
    "shopify_line_item",
    "shopify_order",
    "shopify_product_image",
    "shopify_product_variant",
    "shopify_product",
    "shopify_raw_ingest",
    "shopify_refund",
    "shopify_transaction",
    
    # Integration metrics (child tables)
    "integration_daily_metric",
    "integration_metric",
    
    # Integration parent table
    "integration",
]

async def table_exists(session, table_name: str) -> bool:
    """Check if a table exists in the database."""
    try:
        result = await session.exec(
            text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table_name}')")
        )
        return result.one()[0]
    except Exception as e:
        print(f"Error checking table {table_name}: {e}")
        return False

async def archive_tables():
    """Rename tables to hide them from active tables list."""
    print("Archiving tables (renaming with _archived suffix)...")
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    archived_count = 0
    skipped_count = 0
    
    for table_name in TABLES_TO_ARCHIVE:
        archived_name = f"{table_name}_archived"
        
        # Check if table exists
        if not await table_exists(session, table_name):
            print(f"⏭️  Skipping {table_name} (doesn't exist)")
            skipped_count += 1
            continue
            
        # Check if archived version already exists
        if await table_exists(session, archived_name):
            print(f"⚠️  Skipping {table_name} (archived version already exists)")
            skipped_count += 1
            continue
        
        try:
            print(f"📦 Archiving: {table_name} → {archived_name}")
            await session.exec(text(f"ALTER TABLE {table_name} RENAME TO {archived_name}"))
            archived_count += 1
        except Exception as e:
            print(f"❌ Error archiving {table_name}: {e}")
    
    await session.commit()
    await session.close()
    
    print(f"\n✅ Archive complete!")
    print(f"   Archived: {archived_count} tables")
    print(f"   Skipped: {skipped_count} tables")

async def restore_tables():
    """Restore archived tables by removing the _archived suffix."""
    print("Restoring tables (removing _archived suffix)...")
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    restored_count = 0
    skipped_count = 0
    
    # Restore in reverse order to handle dependencies
    for table_name in reversed(TABLES_TO_ARCHIVE):
        archived_name = f"{table_name}_archived"
        
        # Check if archived version exists
        if not await table_exists(session, archived_name):
            print(f"⏭️  Skipping {table_name} (no archived version found)")
            skipped_count += 1
            continue
            
        # Check if active version already exists
        if await table_exists(session, table_name):
            print(f"⚠️  Skipping {table_name} (active version already exists)")
            skipped_count += 1
            continue
        
        try:
            print(f"📤 Restoring: {archived_name} → {table_name}")
            await session.exec(text(f"ALTER TABLE {archived_name} RENAME TO {table_name}"))
            restored_count += 1
        except Exception as e:
            print(f"❌ Error restoring {table_name}: {e}")
    
    await session.commit()
    await session.close()
    
    print(f"\n✅ Restore complete!")
    print(f"   Restored: {restored_count} tables")
    print(f"   Skipped: {skipped_count} tables")

async def main():
    parser = argparse.ArgumentParser(
        description="Archive or restore Integration and Shopify tables.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 archive_integration_tables.py archive   # Hide tables from active list
  python3 archive_integration_tables.py restore   # Restore tables to active list
        """
    )
    parser.add_argument(
        "action",
        choices=["archive", "restore"],
        help="Action to perform: 'archive' to hide tables, 'restore' to bring them back"
    )
    
    args = parser.parse_args()
    
    if args.action == "archive":
        await archive_tables()
    elif args.action == "restore":
        await restore_tables()

if __name__ == "__main__":
    asyncio.run(main())
