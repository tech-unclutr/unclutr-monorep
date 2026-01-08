from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
import uuid

from app.core.db import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.services import integration_service
from pydantic import BaseModel

router = APIRouter()

async def get_current_company_id(
    session: AsyncSession = Depends(get_session),
    current_user_token: dict = Depends(get_current_user),
) -> uuid.UUID:
    user_id = current_user_token.get("uid")
    user = await session.get(User, user_id)
    if not user or not user.current_company_id:
        # Check if they have a company membership even if not set on user profile
        from app.models.iam import CompanyMembership
        from sqlmodel import select
        stmt = select(CompanyMembership).where(CompanyMembership.user_id == user_id)
        membership = (await session.exec(stmt)).first()
        if not membership:
            raise HTTPException(status_code=404, detail="Company not found for user")
        return membership.company_id
    return user.current_company_id

@router.get("/", response_model=List[dict])
async def list_integrations(
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(get_current_company_id)
):
    """
    List all integrations for the current company.
    """
    return await integration_service.get_integrations_for_company(session, company_id)

@router.post("/connect/{slug}")
async def connect_datasource(
    slug: str,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(get_current_company_id)
):
    """
    Connect a datasource (simulated for now).
    """
    try:
        integration = await integration_service.connect_integration(session, company_id, slug)
        return {"status": "success", "integration_id": str(integration.id)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sync/{integration_id}")
async def sync_integration(
    integration_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(get_current_company_id)
):
    """
    Trigger manual sync (simulated).
    """
    # For now, just return success
    return {"status": "sync_triggered", "integration_id": str(integration_id)}

@router.post("/disconnect/{integration_id}")
async def disconnect_integration(
    integration_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(get_current_company_id)
):
    """
    Disconnect an integration.
    """
    try:
        await integration_service.disconnect_integration(session, company_id, integration_id)
        return {"status": "disconnected"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

class AddSourcePayload(BaseModel):
    slug: str
    category: str

@router.post("/add-manual-source")
async def add_manual_source(
    payload: AddSourcePayload,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(get_current_company_id)
):
    """
    Add a new datasource to the company stack manually.
    """
    try:
        return await integration_service.add_manual_datasource(session, company_id, payload.slug, payload.category)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
