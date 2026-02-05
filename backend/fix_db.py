import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.db import engine, init_db
from sqlalchemy import inspect

# Explicitly import ALL models to ensure they're registered with SQLModel metadata
from app.models import *
from app.models.user import User
from app.models.company import Company
from app.models.onboarding_state import OnboardingState
from app.models.iam import CompanyMembership, WorkspaceMembership
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead

async def fix():
    print("=" * 80)
    print("DATABASE INITIALIZATION SCRIPT")
    print("=" * 80)
    
    # Verify models are loaded
    print("\n[1/3] Verifying models are loaded...")
    critical_models = [
        ("User", User),
        ("Company", Company),
        ("OnboardingState", OnboardingState),
        ("CompanyMembership", CompanyMembership),
        ("WorkspaceMembership", WorkspaceMembership),
        ("Campaign", Campaign),
        ("CampaignLead", CampaignLead),
    ]
    
    for model_name, model_class in critical_models:
        table_name = getattr(model_class, '__tablename__', 'N/A')
        print(f"  ✓ {model_name:25} -> table: {table_name}")
    
    # Initialize database
    print("\n[2/3] Creating tables...")
    try:
        await init_db()
        print("  ✓ init_db() completed successfully")
    except Exception as e:
        print(f"  ✗ Failed to initialize DB: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Verify tables were created
    print("\n[3/3] Verifying tables in database...")
    try:
        async with engine.begin() as conn:
            def get_tables(connection):
                inspector = inspect(connection)
                return inspector.get_table_names()
            
            tables = await conn.run_sync(get_tables)
            
        print(f"  Found {len(tables)} tables:")
        for table in sorted(tables):
            print(f"    - {table}")
        
        # Check critical tables
        critical_tables = ["user", "company", "onboarding_state", "company_membership", "workspace_membership"]
        missing_tables = [t for t in critical_tables if t not in tables]
        
        if missing_tables:
            print(f"\n  ✗ WARNING: Missing critical tables: {missing_tables}")
        else:
            print(f"\n  ✓ All critical tables present")
            
        # Specifically check onboarding_state
        if "onboarding_state" in tables:
            print("\n  ✓ SUCCESS: onboarding_state table created!")
        else:
            print("\n  ✗ ERROR: onboarding_state table NOT found!")
            
    except Exception as e:
        print(f"  ✗ Failed to verify tables: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("\n" + "=" * 80)
    print("DATABASE INITIALIZATION COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(fix())
