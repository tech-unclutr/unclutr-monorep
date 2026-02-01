
import asyncio
import uuid
from sqlalchemy import select
from app.core.db import async_session_factory
from app.models.user import User

async def verify_unlock():
    async with async_session_factory() as session:
        # Get a user (preferably the one the developer is using, but any will do for testing logic)
        stmt = select(User).where(User.email.is_not(None))
        result = await session.execute(stmt)
        user = result.scalars().first()
        
        if not user:
            print("No user found")
            return

        print(f"Testing with user: {user.email} (ID: {user.id})")
        print(f"Current settings: {user.settings}")
        
        # Simulate setting the flag
        if not user.settings:
            user.settings = {}
        user.settings["intelligence_unlocked"] = True
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        print(f"Updated settings: {user.settings}")
        assert user.settings.get("intelligence_unlocked") is True
        print("Backend logic verified: User settings can store intelligence_unlocked=True")

if __name__ == "__main__":
    asyncio.run(verify_unlock())
