import asyncio
import uuid
from datetime import datetime
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

# Import our models and services
from app.core.db import engine, init_db
from app.models.company import Company, Brand, Workspace
from app.models.iam import CompanyMembership, WorkspaceMembership, SystemRole
from app.models.onboarding_state import OnboardingState, OnboardingStep
from app.services import onboarding_service
from app.core.context import set_company_ctx, set_user_ctx

async def test_onboarding_to_isolation_flow():
    """
    Simulates a full onboarding flow and then verifies that the Stamping System
    correctly isolates data for that new company.
    """
    print("\n" + "="*50)
    print("PHASE 1: ONBOARDING ATOMICITY TEST")
    print("="*50)
    user_id = f"test-user-{uuid.uuid4().hex[:8]}"
    set_user_ctx(user_id)
    
    async with AsyncSession(engine) as session:
        print(f"DEBUG: Starting onboarding for User: {user_id}")
        identity_data = {"company_name": "Acme Corp", "brand_name": "Acme Gear"}
        await onboarding_service.save_onboarding_step(session, user_id, OnboardingStep.IDENTITY, identity_data)
        
        stack_data = {"source_keys": ["shopify"]}
        await onboarding_service.save_onboarding_step(session, user_id, OnboardingStep.STACK, stack_data)
        
        print("DEBUG: Committing onboarding transaction...")
        company = await onboarding_service.complete_onboarding(session, user_id)
        
        # ASSERT: Company and Brand exist
        stmt = select(Brand).where(Brand.company_id == company.id)
        brand = (await session.exec(stmt)).first()
        
        if brand and brand.name == "Acme Gear":
            print(">>> PASS: Onboarding Atomic Commit Successful.")
        else:
            print(">>> FAIL: Onboarding Commit missing child records.")
            return

    print("\n" + "="*50)
    print("PHASE 2: ISOLATION & STAMPING TEST (THE SHIELD)")
    print("="*50)
    # Simulation: We are now "Logged In" as Acme Corp
    set_company_ctx(company.id)
    
    async with AsyncSession(engine) as session:
        # Create a "leaked" brand for another company manually (Bypassing our service logic)
        other_company_id = uuid.uuid4()
        
        # !! BUG FIX: Clear context before manual injection to simulate a REAL foreign record
        set_company_ctx(None) 
        spy_brand = Brand(name="Spy Brand (Should be hidden)", company_id=other_company_id)
        session.add(spy_brand)
        await session.commit()
        
        # !! RE-SET context to Acme Corp for the leak test
        set_company_ctx(company.id)
        print(f"DEBUG: Foreign 'Spy Brand' injected for company: {other_company_id}")
        
        # TEST: Querying for ALL brands should ONLY return Acme brands
        print("DEBUG: Executing indiscriminate 'SELECT * FROM brand'...")
        results = (await session.exec(select(Brand))).all()
        
        print(f"DEBUG: Visible Brands in this context: {[b.name for b in results]}")
        
        # ASSERT: Spy Brand is NOT visible
        visible_names = [b.name for b in results]
        if "Spy Brand (Should be hidden)" not in visible_names:
            print(">>> PASS: Stamping System hidden the foreign data. Isolation active.")
        else:
            print(">>> FAIL: Security Leak! Stamping System failed to filter foreign data.")

    print("\n" + "="*50)
    print("PHASE 3: NEGATIVE TEST (MISSING CONTEXT)")
    print("="*50)
    # Simulation: Context is CLEARED. Writing should fail.
    set_company_ctx(None)
    print("DEBUG: Company Context Cleared. Attempting an un-stamped write...")
    
    async with AsyncSession(engine) as session:
        try:
            rogue_brand = Brand(name="Rogue Brand")
            session.add(rogue_brand)
            await session.flush()
            print(">>> FAIL: Stamping System allowed a write without company_id context.")
        except ValueError as e:
            print(f">>> PASS: Stamping System blocked un-stamped write with error: {str(e)}")

async def main():
    await init_db()
    await test_onboarding_to_isolation_flow()
    print("\n" + "="*50)
    print("VERIFICATION COMPLETE")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(main())
