import asyncio
from app.core.db import async_session_factory
from app.models.user import User
from sqlmodel import select

async def get_user_id():
    async with async_session_factory() as session:
        r = await session.execute(select(User).limit(1))
        user = r.scalars().first()
        if user:
            print(user.id)

if __name__ == "__main__":
    asyncio.run(get_user_id())
