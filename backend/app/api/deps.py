from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.core import security
from app.core.db import get_session
from app.models.user import User

# Alias for compatibility
get_db_session = get_session

async def get_current_user(
    current_user_token: dict = Depends(security.get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    uid = current_user_token.get("uid")
    if not uid:
        raise HTTPException(status_code=400, detail="Invalid token")
        
    statement = select(User).where(User.id == uid)
    result = await session.execute(statement) # Using execute for safety
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
