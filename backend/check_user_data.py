"""
Diagnostic script to check user's company and onboarding data.
This helps diagnose why "Acme" is showing instead of the user's actual brand name.
"""
import asyncio
from sqlalchemy import select, create_engine
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models.company import Company, Brand
from app.models.onboarding_state import OnboardingState
from app.models.iam import CompanyMembership
from app.core.config import settings
import json

async def check_user_data(user_email: str = "tech.unclutr@gmail.com"):
    engine = create_async_engine(str(settings.DATABASE_URL))
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as db:
        # Find user by email
        from app.models.user import User
        result = await db.execute(select(User).where(User.email == user_email))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ No user found with email: {user_email}")
            return
        
        print(f"✅ Found user: {user.full_name} ({user.email})")
        print(f"   User ID: {user.id}")
        print(f"   Onboarding Completed: {user.onboarding_completed}")
        print()
        
        # Check company membership
        result = await db.execute(
            select(CompanyMembership).where(CompanyMembership.user_id == user.id)
        )
        membership = result.scalar_one_or_none()
        
        if not membership:
            print("❌ No company membership found")
            return
        
        print(f"✅ Company Membership:")
        print(f"   Company ID: {membership.company_id}")
        print(f"   Role: {membership.role}")
        print()
        
        # Check company data
        result = await db.execute(
            select(Company).where(Company.id == membership.company_id)
        )
        company = result.scalar_one_or_none()
        
        if company:
            print(f"📊 Company Data:")
            print(f"   Brand Name: {company.brand_name}")
            print(f"   Legal Name: {company.legal_name}")
            print(f"   Industry: {company.industry}")
            print(f"   Country: {company.country}")
            print(f"   Currency: {company.currency}")
            print(f"   Timezone: {company.timezone}")
            print(f"   Created At: {company.created_at}")
            print()
        
        # Check brand data
        result = await db.execute(
            select(Brand).where(Brand.company_id == membership.company_id)
        )
        brands = result.scalars().all()
        
        if brands:
            print(f"🏷️  Brand Data ({len(brands)} brands):")
            for brand in brands:
                print(f"   - {brand.name} (ID: {brand.id})")
            print()
        
        # Check onboarding state
        result = await db.execute(
            select(OnboardingState).where(OnboardingState.user_id == user.id)
        )
        state = result.scalar_one_or_none()
        
        if state:
            print(f"📝 Onboarding State:")
            print(f"   Is Completed: {state.is_completed}")
            print(f"   Current Page: {state.current_page}")
            print(f"   Created At: {state.created_at}")
            print(f"   Last Saved At: {state.last_saved_at}")
            print()
            
            if state.basics_data:
                print(f"   Basics Data:")
                basics = state.basics_data
                print(f"      Company Name: {basics.get('companyName', 'N/A')}")
                print(f"      Brand Name: {basics.get('brandName', 'N/A')}")
                print(f"      Category: {basics.get('category', 'N/A')}")
                region = basics.get('region', {})
                print(f"      Region: {region.get('country', 'N/A')} / {region.get('currency', 'N/A')}")
                print()
        else:
            print("❌ No onboarding state found")
        
        # Summary
        print("\n" + "="*60)
        print("DIAGNOSIS:")
        print("="*60)
        
        if company and company.brand_name == "Acme":
            print("⚠️  ISSUE CONFIRMED: Company brand_name is 'Acme'")
            
            if state and state.basics_data:
                onboarding_brand = state.basics_data.get('brandName')
                if onboarding_brand and onboarding_brand != "Acme":
                    print(f"✅ Onboarding state has correct brand: '{onboarding_brand}'")
                    print("   → RECOMMENDATION: Re-sync from onboarding state or update manually")
                else:
                    print(f"⚠️  Onboarding state also has 'Acme' or empty brand name")
                    print("   → RECOMMENDATION: Update brand name via Settings UI")
            else:
                print("⚠️  No onboarding basics data found")
                print("   → RECOMMENDATION: Update brand name via Settings UI")
        else:
            print(f"✅ Brand name looks correct: '{company.brand_name if company else 'N/A'}'")
    
    await engine.dispose()

if __name__ == "__main__":
    import sys
    email = sys.argv[1] if len(sys.argv) > 1 else "tech.unclutr@gmail.com"
    asyncio.run(check_user_data(email))
