
import asyncio
import sys
import os

sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from app.models.onboarding_state import OnboardingState
from app.services.onboarding_service import sync_company_to_state

async def main():
    async_session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    target_user_id = "QrOwZmlu4ycKYdaUMz09rh0CoCc2" # tech.unclutr@gmail.com
    
    async with async_session_factory() as session:
        print(f"--- Inspecting State for {target_user_id} ---")
        stmt = select(OnboardingState).where(OnboardingState.user_id == target_user_id)
        res = await session.exec(stmt)
        state = res.first()
        
        if not state:
            print("State: NOT FOUND (Sync should create it)")
        else:
            print(f"State ID: {state.id}")
            print(f"Is Completed: {state.is_completed}")
            print(f"Basics Data: {state.basics_data}")
            
            company_name = state.basics_data.get("companyName") if state.basics_data else None
            print(f"Company Name in Draft: '{company_name}'")
            
            # Check condition logic
            is_draft_empty = not state.basics_data or not state.basics_data.get("companyName")
            print(f"Logic 'is_draft_empty' evaluates to: {is_draft_empty}")
            
            should_sync = not state.is_completed # based on latest "ALWAYS SYNC" logic
            print(f"Logic 'should_sync' (Always Sync) evaluates to: {should_sync}")
            
        print("\n--- Triggering Manual Sync ---")
        try:
            new_state = await sync_company_to_state(session, target_user_id)
            print("Sync: SUCCESS")
            print(f"New Basics Data: {new_state.basics_data}")
        except Exception as e:
            print(f"Sync: FAILED - {e}")

if __name__ == "__main__":
    asyncio.run(main())
