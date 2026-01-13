import asyncio
from app.core.db import async_session_factory
from sqlalchemy import text

async def verify_migration():
    async with async_session_factory() as session:
        # Check shopify_address table structure
        result = await session.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'shopify_address'
            AND column_name IN ('customer_id', 'raw_payload', 'shopify_customer_id')
            ORDER BY column_name;
        """))
        
        print("✅ shopify_address table columns:")
        for row in result:
            print(f"  - {row[0]}: {row[1]} (nullable: {row[2]})")
        
        # Check if there are any addresses
        result = await session.execute(text("SELECT COUNT(*) FROM shopify_address"))
        count = result.scalar()
        print(f"\n📊 Total addresses in database: {count}")
        
        # Check foreign key constraints
        result = await session.execute(text("""
            SELECT
                tc.constraint_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.table_name = 'shopify_address'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'customer_id';
        """))
        
        print("\n🔗 Foreign key constraints on customer_id:")
        for row in result:
            print(f"  - {row[0]}: {row[1]} -> {row[2]}.{row[3]}")

if __name__ == "__main__":
    asyncio.run(verify_migration())
