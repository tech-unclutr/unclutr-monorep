from fastapi import Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core import security
from app.core.db import get_session
from app.models.user import User

# Alias for compatibility
get_db_session = get_session

async def get_current_user(
    token_payload: dict = Depends(security.get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    uid = token_payload.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="User ID not found in token")
        
    user = await session.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user
