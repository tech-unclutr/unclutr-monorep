from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import Dict, Any
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.core import security
from app.core.db import get_session
from app.models.user import User, UserRead, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserRead)
async def read_user_me(
    current_user_token: dict = Depends(security.get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get current user profile.
    Auto-populates designation from campaigns if not set.
    """
    uid = current_user_token.get("uid")
    if not uid:
        raise HTTPException(status_code=400, detail="Invalid token")
        
    statement = select(User).where(User.id == uid)
    result = await session.exec(statement)
    user = result.first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Auto-populate designation from most recent campaign if not set
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"User designation check: '{user.designation}', is_empty: {not user.designation}")
    
    if not user.designation:
        from app.models.campaign import Campaign
        from sqlmodel import desc
        
        logger.info(f"Attempting to populate designation from campaigns for user {uid}")
        
        campaign_stmt = select(Campaign).where(
            Campaign.user_id == uid
        ).order_by(desc(Campaign.created_at)).limit(1)
        
        campaign_result = await session.exec(campaign_stmt)
        latest_campaign = campaign_result.first()
        
        logger.info(f"Latest campaign found: {latest_campaign is not None}, role: {latest_campaign.team_member_role if latest_campaign else 'N/A'}")
        
        if latest_campaign and latest_campaign.team_member_role:
            logger.info(f"Setting designation to: {latest_campaign.team_member_role}")
            user.designation = latest_campaign.team_member_role
            session.add(user)
            await session.commit()
            await session.refresh(user)
            logger.info(f"Designation updated successfully")
        
    return user

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
    if user_in.linkedin_profile is not None:
        user.linkedin_profile = user_in.linkedin_profile
    if user_in.designation is not None:
        user.designation = user_in.designation
    if user_in.team is not None:
        user.team = user_in.team
    if user_in.picture_url is not None:
        user.picture_url = user_in.picture_url
    if user_in.contact_number is not None:
        user.contact_number = user_in.contact_number
    if user_in.otp_verified is not None:
        user.otp_verified = user_in.otp_verified
        
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    return user

@router.patch("/settings", response_model=UserRead)
async def update_user_settings(
    settings: Dict[str, Any] = Body(...),
    current_user_token: dict = Depends(security.get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update user settings (merged with existing).
    """
    uid = current_user_token.get("uid")
    if not uid:
        raise HTTPException(status_code=400, detail="Invalid token")
        
    statement = select(User).where(User.id == uid)
    result = await session.exec(statement)
    user = result.first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Merge settings
    current_settings = user.settings or {}
    updated_settings = {**current_settings, **settings}
    
    # SQLModel/SQLAlchemy JSONB update trick to ensure change is detected
    user.settings = dict(updated_settings) 
    
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    return user
