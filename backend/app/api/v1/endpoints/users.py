from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.core import security
from app.core.db import get_session
from app.models.user import User, UserRead, UserUpdate

router = APIRouter()

@router.patch("/me", response_model=UserRead)
async def update_user_me(
    user_in: UserUpdate,
    current_user_token: dict = Depends(security.get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update own user profile.
    """
    uid = current_user_token.get("uid")
    if not uid:
        raise HTTPException(status_code=400, detail="Invalid token")
        
    statement = select(User).where(User.id == uid)
    result = await session.exec(statement)
    user = result.first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.picture_url is not None:
        user.picture_url = user_in.picture_url
        
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    return user
