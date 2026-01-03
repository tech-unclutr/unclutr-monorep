from typing import Any
import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import get_session
from app.core.security import get_current_user
from app.models.company import Company

router = APIRouter()

@router.get("/{id}", response_model=Company)
async def read_company(
    id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
) -> Any:
    """
    Get company by ID.
    """
    company = await session.get(Company, id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company
