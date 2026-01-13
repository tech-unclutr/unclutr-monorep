
import asyncio
import sys
import os
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import get_session

async def reset_user_data():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    print("⚠️  STARTING USER DATA RESET ⚠️")
    print("This will permanently delete all user-generated data.")
    print("-" * 50)

    # Tables to explicitly truncate (others will be handled by CASCADE)
    # Order matters slightly for foreign keys if not using CASCADE, but with CASCADE it's easier.
    # We target the root user/company tables and specific isolated ones.
    
    # Core User/Tenant Tables
    core_tables = [
        "user",
        "company",  # Cascades to workspace, brand, integration, memberships
        "onboarding_state",
        "audit_trail",
        "all_requests", # User Requests
    ]
    
    # Find all Shopify tables dynamically to ensure full cleanup
    # (Though company cascade might catch them, explicit is safer for detached records)
    result = await session.exec(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'shopify_%'"))
    shopify_tables = [row[0] for row in result.all()]
    
    tables_to_truncate = core_tables + shopify_tables
    
    # Use TRUNCATE with CASCADE to handle foreign keys efficiently
    # We join them to do it in fewer commands or loop.
    # A single TRUNCATE statement with multiple tables is atomic and handles circular refs better.
    
    quoted_tables = [f'"{t}"' for t in tables_to_truncate]
    truncate_query = f"TRUNCATE TABLE {', '.join(quoted_tables)} CASCADE;"
    
    try:
        print(f"Truncating tables: {', '.join(tables_to_truncate)}")
        await session.exec(text(truncate_query))
        await session.commit()
        print("✅ User data reset complete.")
        
    except Exception as e:
        print(f"❌ Error during reset: {e}")
        await session.rollback()
    
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(reset_user_data())
