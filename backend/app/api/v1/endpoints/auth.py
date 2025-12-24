from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core import security
from app.core.db import get_session
from app.models.user import User, UserRead, UserCreate
from app.services import auth_service

router = APIRouter()

@router.post("/sync", response_model=UserRead)
async def sync_user_endpoint(
    current_user_token: dict = Depends(security.get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Syncs Firebase User to Local DB. 
    Call this after Firebase Login on Frontend.
    """
    uid = current_user_token.get("uid")
    email = current_user_token.get("email")
    if not uid or not email:
        raise HTTPException(status_code=400, detail="Invalid token payload")
    
    user_in = UserCreate(
        id=uid,
        email=email,
        full_name=current_user_token.get("name"),
        picture_url=current_user_token.get("picture")
    )
    
    user = await auth_service.sync_user(session, user_in)
    return user
