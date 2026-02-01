"""
Fix script to sync brand name from company table to brands table.
This resolves the inconsistency where company.brand_name is correct but brand.name is outdated.
"""
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models.company import Company, Brand
from app.models.iam import CompanyMembership
from app.core.config import settings

async def fix_brand_name(user_email: str = "tech.unclutr@gmail.com"):
    engine = create_async_engine(str(settings.DATABASE_URL))
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as db:
        # Find user
        from app.models.user import User
        result = await db.execute(select(User).where(User.email == user_email))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ No user found with email: {user_email}")
            return
        
        # Get company membership
        result = await db.execute(
            select(CompanyMembership).where(CompanyMembership.user_id == user.id)
        )
        membership = result.scalar_one_or_none()
        
        if not membership:
            print("❌ No company membership found")
            return
        
        # Get company
        result = await db.execute(
            select(Company).where(Company.id == membership.company_id)
        )
        company = result.scalar_one_or_none()
        
        if not company:
            print("❌ No company found")
            return
        
        # Get brand
        result = await db.execute(
            select(Brand).where(Brand.company_id == company.id)
        )
        brand = result.scalar_one_or_none()
        
        if not brand:
            print("❌ No brand found")
            return
        
        print(f"Current State:")
        print(f"  Company Brand Name: {company.brand_name}")
        print(f"  Brand Table Name: {brand.name}")
        print()
        
        if brand.name != company.brand_name:
            print(f"🔧 Fixing inconsistency...")
            print(f"   Updating brand.name from '{brand.name}' to '{company.brand_name}'")
            
            brand.name = company.brand_name
            db.add(brand)
            await db.commit()
            await db.refresh(brand)
            
            print(f"✅ Fixed! Brand name is now: {brand.name}")
        else:
            print(f"✅ No fix needed - brand name is already correct!")
    
    await engine.dispose()

if __name__ == "__main__":
    import sys
    email = sys.argv[1] if len(sys.argv) > 1 else "tech.unclutr@gmail.com"
    asyncio.run(fix_brand_name(email))
