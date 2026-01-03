from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlmodel import select, SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import get_session
from app.core.security import get_current_user
from app.models.datasource import DataSource, DataSourceCategory
from app.models.datasource_request import UserRequest, RequestStatus, RequestType

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
    request_type: Optional[RequestType] = RequestType.DATASOURCE
    payload: Optional[dict] = None

@router.post("/request", response_model=UserRequest)
async def request_datasource(
    request_data: RequestCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Submit a user request (DataSource, Workspace Deletion, etc.).
    """
    # Check if already requested by this user? Optional.
    # For now just create.
    new_request = UserRequest(
        user_id=current_user["uid"],
        email=current_user.get("email"),
        user_name=current_user.get("name"),
        name=request_data.name,
        category=request_data.category,
        request_type=request_data.request_type,
        payload=request_data.payload
    )
    session.add(new_request)
    await session.commit()
    await session.refresh(new_request)
    return new_request

@router.get("/requests", response_model=List[UserRequest])
async def read_requests(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List all requests (Internal/Control Tower use).
    """
    query = select(UserRequest).where(UserRequest.user_id == current_user["uid"]).order_by(UserRequest.created_at.desc())
    results = await session.exec(query)
    return results.all()

@router.delete("/requests/{request_id}", status_code=204)
async def delete_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Delete a request (Withdrawal).
    """
    request = await session.get(UserRequest, request_id)
    if not request:
        # Idempotent success or 404? 404 is better for clarity here.
        return None 
    
    if request.user_id != current_user["uid"]:
        # Unauthorized to delete others' requests
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not authorized to delete this request")

    await session.delete(request)
    await session.commit()
    return None
