import asyncio
from sqlmodel import select
from app.core.db import get_session
from app.models.onboarding_state import OnboardingState

async def inspect_onboarding_state():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    stmt = select(OnboardingState)
    result = await session.exec(stmt)
    states = result.all()
    
    for state in states:
        print(f"--- OnboardingState: {state.user_id} ---")
        print(f"is_completed: {state.is_completed}")
        print(f"channels_data: {state.channels_data}")
        print(f"stack_data: {state.stack_data}")

    await session.close()

if __name__ == "__main__":
    asyncio.run(inspect_onboarding_state())
