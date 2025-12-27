from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.models.user import User, UserCreate
from datetime import datetime

from app.models.iam import CompanyMembership

async def sync_user(session: AsyncSession, user_in: UserCreate) -> User:
    statement = select(User).where(User.id == user_in.id)
    result = await session.exec(statement)
    user = result.first()
    
    if not user:
        # Create new
        user = User(
            id=user_in.id,
            email=user_in.email,
            full_name=user_in.full_name,
            picture_url=user_in.picture_url,
            created_at=datetime.utcnow(),
            last_login_at=datetime.utcnow()
        )
        session.add(user)
    else:
        # Update existing
        user.full_name = user_in.full_name
        user.picture_url = user_in.picture_url
        user.email = user_in.email
        user.last_login_at = datetime.utcnow()
        session.add(user)
    
    # Check if onboarding is completed
    membership_stmt = select(CompanyMembership).where(CompanyMembership.user_id == user.id)
    membership_result = await session.exec(membership_stmt)
    is_onboarded = membership_result.first() is not None
    
    await session.commit()
    
    # Attach transient attribute for the response serializer
    user.onboarding_completed = is_onboarded
    
    return user
