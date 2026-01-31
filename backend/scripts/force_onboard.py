import asyncio
import os
import sys

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import async_session_factory
from app.models.user import User
from sqlalchemy.future import select

async def force_onboard():
    async with async_session_factory() as session:
        # Find the user
        result = await session.execute(select(User).where(User.email == "tech.unclutr@gmail.com"))
        user = result.scalars().first()
        
        if user:
            print(f"Found user: {user.email}")
            user.onboarding_completed = True
            # Also ensure they have a company if needed (though the dashboard needs one)
            # user.company_id = ... (assuming it exists or is managed)
            
            session.add(user)
            await session.commit()
            print("User onboarding_completed set to True.")
        else:
            print("User not found.")

if __name__ == "__main__":
    asyncio.run(force_onboard())
