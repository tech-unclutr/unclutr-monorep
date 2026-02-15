from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_session
from app.core.security import get_current_user
from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanyRead, CompanyUpdate

router = APIRouter()

@router.get("/me", response_model=CompanyRead)
async def read_company_me(
    session: AsyncSession = Depends(get_session),
    current_user_token: dict = Depends(get_current_user),
) -> Any:
    """
    Get current user's company.
    """
    user_id = current_user_token.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    current_user = await session.get(User, user_id)
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    company = None
    if current_user.current_company_id:
        company = await session.get(Company, current_user.current_company_id)
    
    if not company:
        # Fallback/Self-heal: Check for any membership
        from sqlmodel import select

        from app.models.iam import CompanyMembership
        
        stmt = select(CompanyMembership).where(CompanyMembership.user_id == user_id)
        membership = (await session.exec(stmt)).first()
        
        if not membership:
            raise HTTPException(status_code=404, detail="User does not belong to any company")
            
        # Update user's current company
        current_user.current_company_id = membership.company_id
        session.add(current_user)
        await session.commit()
        await session.refresh(current_user)

        # Try getting the company again
        company = await session.get(Company, current_user.current_company_id)
        
    if not company:
        raise HTTPException(status_code=404, detail="Company not found after self-healing")
        
    return company

@router.patch("/me", response_model=CompanyRead)
async def update_company_me(
    *,
    session: AsyncSession = Depends(get_session),
    company_in: CompanyUpdate,
    current_user_token: dict = Depends(get_current_user),
) -> Any:
    """
    Update currrent user's company.
    """
    user_id = current_user_token.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    current_user = await session.get(User, user_id)
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not current_user.current_company_id:
        raise HTTPException(status_code=404, detail="User does not belong to any company")
    
    company = await session.get(Company, current_user.current_company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Update only provided fields
    update_data = company_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)

    session.add(company)
    await session.commit()
    await session.refresh(company)
    return company
