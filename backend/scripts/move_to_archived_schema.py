#!/usr/bin/env python3
"""
Move archived tables to a separate PostgreSQL schema.

This script moves tables ending with '_archived' from the 'public' schema
to a separate 'archived' schema, which hides them from most database tools
while preserving all data.

Usage:
    python3 move_to_archived_schema.py archive   # Move to archived schema
    python3 move_to_archived_schema.py restore   # Move back to public schema
"""

import asyncio
import sys
import os
import argparse
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import get_session

# Tables to move (without the _archived suffix)
TABLES_TO_ARCHIVE = [
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
    "integration_daily_metric",
    "integration_metric",
    "integration",
]

async def table_exists(session, schema: str, table_name: str) -> bool:
    """Check if a table exists in a specific schema."""
    try:
        result = await session.exec(
            text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = '{schema}' AND table_name = '{table_name}')")
        )
        return result.one()[0]
    except Exception as e:
        print(f"Error checking table {schema}.{table_name}: {e}")
        return False

async def archive_to_schema():
    """Move _archived tables from public schema to archived schema."""
    print("Moving archived tables to 'archived' schema...")
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    # Create archived schema if it doesn't exist
    print("Creating 'archived' schema if needed...")
    await session.exec(text("CREATE SCHEMA IF NOT EXISTS archived"))
    await session.commit()
    
    moved_count = 0
    skipped_count = 0
    
    for table_name in TABLES_TO_ARCHIVE:
        archived_name = f"{table_name}_archived"
        
        # Check if table exists in public schema
        if not await table_exists(session, "public", archived_name):
            print(f"⏭️  Skipping {archived_name} (not in public schema)")
            skipped_count += 1
            continue
        
        # Check if table already exists in archived schema
        if await table_exists(session, "archived", archived_name):
            print(f"⚠️  Skipping {archived_name} (already in archived schema)")
            skipped_count += 1
            continue
        
        try:
            print(f"📦 Moving: public.{archived_name} → archived.{archived_name}")
            await session.exec(text(f"ALTER TABLE public.{archived_name} SET SCHEMA archived"))
            moved_count += 1
        except Exception as e:
            print(f"❌ Error moving {archived_name}: {e}")
    
    await session.commit()
    await session.close()
    
    print(f"\n✅ Archive complete!")
    print(f"   Moved: {moved_count} tables")
    print(f"   Skipped: {skipped_count} tables")
    print(f"\n💡 Tables are now in the 'archived' schema and hidden from default views.")
    print(f"   To view them in Postico2, you'll need to explicitly select the 'archived' schema.")

async def restore_from_schema():
    """Move tables from archived schema back to public schema."""
    print("Restoring tables from 'archived' schema to 'public' schema...")
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    restored_count = 0
    skipped_count = 0
    
    for table_name in TABLES_TO_ARCHIVE:
        archived_name = f"{table_name}_archived"
        
        # Check if table exists in archived schema
        if not await table_exists(session, "archived", archived_name):
            print(f"⏭️  Skipping {archived_name} (not in archived schema)")
            skipped_count += 1
            continue
        
        # Check if table already exists in public schema
        if await table_exists(session, "public", archived_name):
            print(f"⚠️  Skipping {archived_name} (already in public schema)")
            skipped_count += 1
            continue
        
        try:
            print(f"📤 Restoring: archived.{archived_name} → public.{archived_name}")
            await session.exec(text(f"ALTER TABLE archived.{archived_name} SET SCHEMA public"))
            restored_count += 1
        except Exception as e:
            print(f"❌ Error restoring {archived_name}: {e}")
    
    await session.commit()
    await session.close()
    
    print(f"\n✅ Restore complete!")
    print(f"   Restored: {restored_count} tables")
    print(f"   Skipped: {skipped_count} tables")

async def main():
    parser = argparse.ArgumentParser(
        description="Move archived tables to/from a separate schema.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 move_to_archived_schema.py archive   # Move to archived schema (hide from view)
  python3 move_to_archived_schema.py restore   # Move back to public schema
        """
    )
    parser.add_argument(
        "action",
        choices=["archive", "restore"],
        help="Action to perform: 'archive' to move to archived schema, 'restore' to move back"
    )
    
    args = parser.parse_args()
    
    if args.action == "archive":
        await archive_to_schema()
    elif args.action == "restore":
        await restore_from_schema()

if __name__ == "__main__":
    asyncio.run(main())
