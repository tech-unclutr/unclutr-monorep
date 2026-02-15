import asyncio
import uuid
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

async def verify():
    from app.core.db import async_session_factory
    from app.models.user import User, UserCreate
    from app.models.company import Company
    from app.models.iam import CompanyMembership
    from app.services.auth_service import sync_user
    from app.api.v1.endpoints.company import read_company_me
    from sqlmodel import select

    async with async_session_factory() as session:
        # 1. Setup mock data
        uid = f"test-user-{uuid.uuid4()}"
        email = f"{uid}@example.com"
        
        print(f"Creating test user {uid}")
        
        # Create company
        company = Company(brand_name="Test Company")
        session.add(company)
        await session.flush()
        
        # Create user
        user = User(id=uid, email=email)
        session.add(user)
        await session.commit()
        
        # Create membership
        membership = CompanyMembership(company_id=company.id, user_id=uid)
        session.add(membership)
        await session.commit()
        
        print(f"--- Verification Step 1: sync_user persistence ---")
        user_in = UserCreate(id=uid, email=email, full_name="Test User")
        
        # Verify initial state: current_company_id should be None or at least not the new company yet
        # (Though sync_user might have already set it if it ran during creation, but we'll force it None)
        user.current_company_id = None
        session.add(user)
        await session.commit()
        
        # sync_user should detect membership and update current_company_id AND persist it
        await sync_user(session, user_in)
        
        # Create a new session to ensure we read from DB
        async with async_session_factory() as session2:
            db_user = await session2.get(User, uid)
            print(f"DB User current_company_id after sync: {db_user.current_company_id}")
            if db_user.current_company_id != company.id:
                print("❌ ERROR: current_company_id not persisted after sync!")
                return
            else:
                print("✅ current_company_id persisted after sync")
        
        print(f"\n--- Verification Step 2: read_company_me self-healing ---")
        # Set to invalid ID
        user.current_company_id = uuid.uuid4()
        session.add(user)
        await session.commit()
        print(f"Set invalid current_company_id: {user.current_company_id}")
        
        # Mock token for read_company_me
        token = {"uid": uid}
        
        # This should now self-heal instead of 404
        try:
            result_company = await read_company_me(session, token)
            print(f"read_company_me returned company: {result_company.brand_name}")
            
            await session.refresh(user)
            print(f"User current_company_id after self-heal: {user.current_company_id}")
            if user.current_company_id != company.id:
                 print("❌ ERROR: current_company_id not self-healed!")
                 return
            else:
                print("✅ current_company_id self-healed")
        except Exception as e:
            print(f"❌ ERROR: read_company_me failed: {e}")
            return
            
        # Cleanup
        try:
            # Delete in order: membership -> user -> company
            await session.delete(membership)
            await session.commit()
            
            # Re-fetch user in a fresh session to avoid state issues during delete
            async with async_session_factory() as session3:
                db_user = await session3.get(User, uid)
                if db_user:
                    await session3.delete(db_user)
                    await session3.commit()
                
                db_company = await session3.get(Company, company.id)
                if db_company:
                    await session3.delete(db_company)
                    await session3.commit()
            
            print("\n✅ Verification SUCCESS")
        except Exception as e:
            print(f"\n⚠️ Cleanup error (ignoring): {e}")
            print("✅ Verification SUCCESS (Main tests passed)")

if __name__ == "__main__":
    asyncio.run(verify())
