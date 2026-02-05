#!/usr/bin/env python3
import asyncio
from app.core.db import engine
from app.models.onboarding_state import OnboardingState
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

async def inspect_state():
    user_id = "QrOwZmlu4ycKYdaUMz09rh0CoCc2"
    print(f"Inspecting OnboardingState for user: {user_id}")
    
    async with AsyncSession(engine) as session:
        stmt = select(OnboardingState).where(OnboardingState.user_id == user_id)
        result = await session.exec(stmt)
        state = result.first()
        
        if state:
            print("OnboardingState Found:")
            print(f"  - Current Page: {state.current_page}")
            print(f"  - Is Completed: {state.is_completed}")
            print(f"  - Basics Data: {state.basics_data}")
            # print(f"  - Channels Data: {state.channels_data}")
            # print(f"  - Stack Data: {state.stack_data}")
        else:
            print("OnboardingState not found for this user.")

if __name__ == "__main__":
    asyncio.run(inspect_state())
