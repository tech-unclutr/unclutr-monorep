from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
import uuid

from app.core.db import get_session
from app.core.security import get_current_user
from app.models.datasource import DataSource
from app.api.v1.endpoints.integrations import get_current_company_id
from app.models.company import Company

router = APIRouter()

from app.models.datasource_request import UserRequest, RequestType, RequestStatus
from pydantic import BaseModel


@router.get("/")
async def list_datasources(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch all datasources.
    """
    stmt = select(DataSource).order_by(DataSource.name)
    result = await session.exec(stmt)
    datasources = result.all()
    return datasources


@router.get("/all")
async def list_all_datasources(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch all datasources grouped by category for the Add Datasource dialog.
    Common datasources (is_common=true) are shown first within each category.
    """
    stmt = select(DataSource).order_by(
        DataSource.category,
        DataSource.is_common.desc(),  # Common ones first
        DataSource.name
    )
    result = await session.exec(stmt)
    datasources = result.all()
    
    # Group by category
    categorized = {}
    for ds in datasources:
        category = ds.category or "Other"
        if category not in categorized:
            categorized[category] = []
        
        categorized[category].append({
            "id": str(ds.id),
            "name": ds.name,
            "slug": ds.slug,
            "logo_url": ds.logo_url,
            "category": ds.category,
            "description": ds.description,
            "is_implemented": ds.is_implemented,
            "is_coming_soon": ds.is_coming_soon,
        })
    
    return categorized


@router.put("/company/stack")
async def update_company_stack(
    stack_data: dict,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(get_current_company_id)
):
    """
    Update company's stack_summary and channels_summary.
    Accepts a list of datasource IDs and categorizes them properly based on their category.
    """
    # Get the list of selected datasource IDs
    selected_ids = stack_data.get("datasource_ids", [])
    
    # Fetch the datasources to get their categories
    if selected_ids:
        # Convert string IDs to UUIDs
        uuid_ids = []
        for id_str in selected_ids:
            try:
                uuid_ids.append(uuid.UUID(id_str))
            except (ValueError, AttributeError):
                continue
        
        if uuid_ids:
            stmt = select(DataSource).where(DataSource.id.in_(uuid_ids))
            result = await session.exec(stmt)
            datasources = result.all()
        else:
            datasources = []
    else:
        datasources = []
    
    # Categorize datasources based on their category field
    stack_summary = {"stack": {}, "selectedTools": []}
    channels_summary = {"channels": {"d2c": [], "marketplaces": [], "qcom": [], "others": []}}
    
    # Define which categories go into channels vs stack
    channel_categories = {
        "Storefront": "d2c",
        "Marketplace": "marketplaces",
        "QuickCommerce": "qcom",
        "Network": "others",
        "SocialCommerce": "others",
    }
    
    for ds in datasources:
        ds_id = str(ds.id)
        
        # Check if this is a channel category
        if ds.category in channel_categories:
            channel_type = channel_categories[ds.category]
            channels_summary["channels"][channel_type].append(ds_id)
        else:
            # Everything else goes into stack
            category_key = ds.category.lower() if ds.category else "other"
            if category_key not in stack_summary["stack"]:
                stack_summary["stack"][category_key] = []
            stack_summary["stack"][category_key].append(ds_id)
            stack_summary["selectedTools"].append(ds_id)
    
    # Update the company
    company = await session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company.stack_summary = stack_summary
    company.channels_summary = channels_summary
    
    session.add(company)
    await session.commit()
    await session.refresh(company)
    
    return {"status": "success", "stack_summary": stack_summary, "channels_summary": channels_summary}


# --- Request Management Endpoints ---

class RequestCreate(BaseModel):
    name: str
    category: Optional[str] = None
    request_type: RequestType = RequestType.DATASOURCE
    payload: Optional[dict] = None


@router.post("/request", response_model=UserRequest)
async def create_user_request(
    request_data: RequestCreate,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new user request (e.g. for datasource or workspace deletion).
    """
    user_id = current_user.get("uid")
    # Basic user info from token claims if available, or just ID
    email = current_user.get("email")
    
    new_request = UserRequest(
        user_id=user_id,
        email=email,
        name=request_data.name,
        category=request_data.category,
        request_type=request_data.request_type,
        payload=request_data.payload,
        status=RequestStatus.PENDING
    )
    
    session.add(new_request)
    await session.commit()
    await session.refresh(new_request)
    return new_request


@router.get("/requests", response_model=List[UserRequest])
async def get_user_requests(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all requests created by the current user.
    """
    user_id = current_user.get("uid")
    stmt = select(UserRequest).where(UserRequest.user_id == user_id).order_by(UserRequest.created_at.desc())
    result = await session.exec(stmt)
    return result.all()


@router.delete("/requests/{request_id}")
async def cancel_user_request(
    request_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Cancel/Delete a user request.
    Only allows deleting pending requests owned by the user.
    """
    user_id = current_user.get("uid")
    request = await session.get(UserRequest, request_id)
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if request.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this request")
        
    if request.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Cannot cancel a processed request")
        
    await session.delete(request)
    await session.commit()
    return {"status": "success", "message": "Request cancelled"}
