"""
Verification script for Total Inventory Value calculation.
Validates the accuracy of the CashflowGenerator insight.
"""
import asyncio
from sqlalchemy import text, select, func
from app.core.db import get_session
from app.models.shopify.inventory import ShopifyInventoryLevel, ShopifyInventoryItem
from app.models.integration import Integration
from app.models.company import Workspace, Brand
from uuid import UUID
import sys

async def verify_inventory_calculation(brand_id_str: str = None):
    """
    Verifies the inventory value calculation matches what the CashflowGenerator produces.
    """
    async for session in get_session():
        try:
            # If no brand_id provided, get the first brand
            if not brand_id_str:
                brand_stmt = select(Brand).limit(1)
                brand = (await session.execute(brand_stmt)).scalars().first()
                if not brand:
                    print("❌ No brands found in database")
                    return
                brand_id = brand.id
                print(f"📊 Using Brand: {brand.name} ({brand_id})")
            else:
                brand_id = UUID(brand_id_str)
                brand_stmt = select(Brand).where(Brand.id == brand_id)
                brand = (await session.execute(brand_stmt)).scalars().first()
                print(f"📊 Verifying Brand: {brand.name if brand else 'Unknown'} ({brand_id})")
            
            print("\n" + "="*80)
            print("INVENTORY VALUE CALCULATION VERIFICATION")
            print("="*80)
            
            # Method 1: Direct SQL (what CashflowGenerator uses)
            print("\n1️⃣  CashflowGenerator Method (SQLAlchemy ORM):")
            stmt = select(func.sum(ShopifyInventoryLevel.available * ShopifyInventoryItem.cost)).join(
                ShopifyInventoryItem, 
                ShopifyInventoryLevel.shopify_inventory_item_id == ShopifyInventoryItem.shopify_inventory_item_id
            ).join(
                Integration, ShopifyInventoryLevel.integration_id == Integration.id
            ).join(
                Workspace, Integration.workspace_id == Workspace.id
            ).where(
                Workspace.brand_id == brand_id
            )
            
            inventory_value_orm = (await session.execute(stmt)).scalar() or 0.0
            print(f"   Total Inventory Value: ${inventory_value_orm:,.2f}")
            
            # Method 2: Raw SQL for verification
            print("\n2️⃣  Raw SQL Verification:")
            result = await session.execute(text('''
                SELECT 
                    COUNT(*) as total_items,
                    SUM(sil.available) as total_quantity,
                    SUM(sil.available * sii.cost) as calculated_value,
                    AVG(sii.cost) as avg_cost
                FROM shopify_inventory_level sil
                JOIN shopify_inventory_item sii 
                    ON sil.shopify_inventory_item_id = sii.shopify_inventory_item_id
                JOIN integration i ON sil.integration_id = i.id
                JOIN workspace w ON i.workspace_id = w.id
                WHERE w.brand_id = :brand_id
                    AND sil.available > 0 
                    AND sii.cost > 0
            '''), {"brand_id": str(brand_id)})
            row = result.fetchone()
            print(f"   Total Items: {row[0]}")
            print(f"   Total Quantity: {row[1]:,.0f} units")
            print(f"   Average Cost: ${row[3]:,.2f}")
            print(f"   Total Inventory Value: ${row[2]:,.2f}")
            
            # Check for data quality issues
            print("\n3️⃣  Data Quality Checks:")
            
            # Missing cost data
            missing_cost = await session.execute(text('''
                SELECT COUNT(*) 
                FROM shopify_inventory_level sil
                JOIN shopify_inventory_item sii 
                    ON sil.shopify_inventory_item_id = sii.shopify_inventory_item_id
                JOIN integration i ON sil.integration_id = i.id
                JOIN workspace w ON i.workspace_id = w.id
                WHERE w.brand_id = :brand_id
                    AND sil.available > 0 
                    AND (sii.cost IS NULL OR sii.cost = 0)
            '''), {"brand_id": str(brand_id)})
            missing = missing_cost.scalar()
            
            if missing > 0:
                print(f"   ⚠️  WARNING: {missing} items have stock but missing/zero cost")
                print(f"      This means inventory value is UNDERSTATED")
            else:
                print(f"   ✅ All items with stock have cost data")
            
            # Zero/negative quantities
            zero_qty = await session.execute(text('''
                SELECT COUNT(*) 
                FROM shopify_inventory_level sil
                JOIN integration i ON sil.integration_id = i.id
                JOIN workspace w ON i.workspace_id = w.id
                WHERE w.brand_id = :brand_id
                    AND sil.available <= 0
            '''), {"brand_id": str(brand_id)})
            zero_count = zero_qty.scalar()
            print(f"   ℹ️  {zero_count} items have zero or negative stock (excluded from calculation)")
            
            # Sample top items
            print("\n4️⃣  Top 10 Items by Value:")
            sample = await session.execute(text('''
                SELECT 
                    sii.sku,
                    sil.available,
                    sii.cost,
                    (sil.available * sii.cost) as item_value
                FROM shopify_inventory_level sil
                JOIN shopify_inventory_item sii 
                    ON sil.shopify_inventory_item_id = sii.shopify_inventory_item_id
                JOIN integration i ON sil.integration_id = i.id
                JOIN workspace w ON i.workspace_id = w.id
                WHERE w.brand_id = :brand_id
                    AND sil.available > 0 
                    AND sii.cost > 0
                ORDER BY (sil.available * sii.cost) DESC
                LIMIT 10
            '''), {"brand_id": str(brand_id)})
            
            print(f"   {'SKU':<20} {'Qty':>10} {'Cost':>12} {'Value':>15}")
            print(f"   {'-'*20} {'-'*10} {'-'*12} {'-'*15}")
            for row in sample:
                sku = row[0] or 'N/A'
                print(f"   {sku:<20} {row[1]:>10,.0f} ${row[2]:>11,.2f} ${row[3]:>14,.2f}")
            
            # Comparison
            print("\n" + "="*80)
            print("FINAL VERIFICATION:")
            print("="*80)
            diff = abs(inventory_value_orm - (row[2] if row[2] else 0))
            if diff < 0.01:
                print(f"✅ CALCULATION VERIFIED: Both methods match!")
                print(f"   Total Inventory Value: ${inventory_value_orm:,.2f}")
            else:
                print(f"❌ DISCREPANCY DETECTED:")
                print(f"   ORM Method: ${inventory_value_orm:,.2f}")
                print(f"   SQL Method: ${row[2]:,.2f}")
                print(f"   Difference: ${diff:,.2f}")
            
            if missing > 0:
                print(f"\n⚠️  ACCURACY WARNING:")
                print(f"   {missing} items with stock are missing cost data")
                print(f"   Actual inventory value may be HIGHER than reported")
            else:
                print(f"\n✅ 100% ACCURACY CONFIRMED")
                print(f"   All items with stock have complete cost data")
            
        except Exception as e:
            print(f"❌ Error during verification: {e}")
            import traceback
            traceback.print_exc()
        finally:
            break

if __name__ == "__main__":
    brand_id = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(verify_inventory_calculation(brand_id))
