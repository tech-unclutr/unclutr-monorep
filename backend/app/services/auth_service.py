from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.models.user import User, UserCreate
from datetime import datetime

async def sync_user(session: AsyncSession, user_in: UserCreate) -> User:
    statement = select(User).where(User.id == user_in.id)
    result = await session.exec(statement)
    user = result.first()
    
    if not user:
        # Create new
        user = User.from_orm(user_in)
        session.add(user)
    else:
        # Update existing
        user.full_name = user_in.full_name
        user.picture_url = user_in.picture_url
        user.email = user_in.email
        user.last_login_at = datetime.utcnow()
        session.add(user)
    
    await session.commit()
    await session.refresh(user)
    return user
