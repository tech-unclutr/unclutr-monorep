from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlmodel import select, SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import get_session
from app.core.security import get_current_user
from app.models.datasource import DataSource, DataSourceCategory
from app.models.datasource_request import DataSourceRequest, RequestStatus

router = APIRouter()

@router.get("/", response_model=List[DataSource])
async def read_datasources(
    category: Optional[DataSourceCategory] = None,
    is_common: Optional[bool] = None,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Retrieve available datasources.
    """
    query = select(DataSource).where(DataSource.is_active == True)
    
    if category:
        query = query.where(DataSource.category == category)
        
    if is_common is not None:
        query = query.where(DataSource.is_common == is_common)
        
    # Order by is_common desc, then name asc
    query = query.order_by(DataSource.is_common.desc(), DataSource.name.asc())
        
    results = await session.exec(query)
    return results.all()

class RequestCreate(SQLModel):
    name: str
    category: Optional[str] = None

@router.post("/request", response_model=DataSourceRequest)
async def request_datasource(
    request_data: RequestCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Submit a request for a missing datasource.
    """
    # Check if already requested by this user? Optional.
    # For now just create.
    new_request = DataSourceRequest(
        user_id=current_user["uid"],
        email=current_user.get("email"),
        user_name=current_user.get("name"),
        name=request_data.name,
        category=request_data.category
    )
    session.add(new_request)
    await session.commit()
    await session.refresh(new_request)
    return new_request

@router.get("/requests", response_model=List[DataSourceRequest])
async def read_requests(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List all datasource requests (Internal/Control Tower use).
    """
    # Ideally restrict to admin/owner? Current User is Owner.
    query = select(DataSourceRequest).order_by(DataSourceRequest.created_at.desc())
    results = await session.exec(query)
    return results.all()
