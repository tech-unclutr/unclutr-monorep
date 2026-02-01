"""
Check current user designation value in database.
"""

import asyncio
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.models.user import User

async def check_user_designation():
    """Check if user has designation set."""
    async with AsyncSession(engine) as session:
        stmt = select(User).where(User.id == "QrOwZmlu4ycKYdaUMz09rh0CoCc2")
        result = await session.exec(stmt)
        user = result.first()
        
        if user:
            print(f"User: {user.full_name}")
            print(f"Designation: '{user.designation}'")
            print(f"Designation is None: {user.designation is None}")
            print(f"Designation is empty string: {user.designation == ''}")
            print(f"Designation bool (falsy): {not user.designation}")
        else:
            print("User not found")

if __name__ == "__main__":
    asyncio.run(check_user_designation())
