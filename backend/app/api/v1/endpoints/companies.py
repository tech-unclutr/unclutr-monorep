from typing import Any
import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import get_session
from app.core.security import get_current_user
from app.models.company import Company

router = APIRouter()

from app.schemas.company_extended import CompanyReadWithBrands
from sqlalchemy.orm import selectinload
from sqlmodel import select

@router.get("/{id}", response_model=CompanyReadWithBrands)
async def read_company(
    id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
) -> Any:
    """
    Get company by ID with brands loaded.
    """
    stmt = select(Company).where(Company.id == id).options(selectinload(Company.brands))
    result = await session.execute(stmt)
    company = result.scalars().first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Security: Verify membership since we bypassed TenantMiddleware
    from app.models.iam import CompanyMembership
    user_id = current_user.get("uid")
    
    mem_stmt = select(CompanyMembership).where(
        CompanyMembership.company_id == id,
        CompanyMembership.user_id == user_id
    )
    membership = (await session.execute(mem_stmt)).scalars().first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Forbidden: You are not a member of this company")
        
    return company
