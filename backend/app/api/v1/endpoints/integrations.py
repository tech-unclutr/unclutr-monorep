from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession
import uuid
from datetime import datetime, timezone

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
@router.get("/{integration_id}", response_model=dict)
async def get_integration(
    integration_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(get_current_company_id)
):
    """
    Get a specific integration with current stats.
    """
    from app.models.integration import Integration
    from app.models.datasource import DataSource
    
    stmt = (
        select(Integration, DataSource)
        .join(DataSource, Integration.datasource_id == DataSource.id)
        .where(
            Integration.id == integration_id,
            Integration.company_id == company_id
        )
    )
    result = await session.execute(stmt)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Integration not found")
        
    integration, datasource = row
    
    return {
        "id": str(integration.id),
        "status": integration.status,
        "last_sync_at": integration.last_sync_at,
        "metadata_info": integration.metadata_info,
        "datasource": {
            "id": str(datasource.id),
            "name": datasource.name,
            "slug": datasource.slug,
            "logo_url": datasource.logo_url,
        }
    }

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
    background_tasks: BackgroundTasks,
    delta: bool = False,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(get_current_company_id)
):
    """
    Trigger manual sync.
    """
    from app.models.integration import Integration, IntegrationStatus
    from app.models.datasource import DataSource
    # Import specific tasks
    from app.services.shopify.tasks import run_shopify_sync_task

    # 1. Fetch Integration & Datasource
    integration = await session.get(Integration, integration_id)
    if not integration or integration.company_id != company_id:
        raise HTTPException(status_code=404, detail="Integration not found")
        
    datasource = await session.get(DataSource, integration.datasource_id)
    if not datasource:
         raise HTTPException(status_code=500, detail="Datasource missing")

    # 2. Dispatch based on Slug/Category
    if datasource.slug == 'shopify':
        # Update status immediately to prevent UI race conditions
        integration.status = IntegrationStatus.SYNCING
        session.add(integration)
        await session.commit()
        
        background_tasks.add_task(run_shopify_sync_task, integration_id=integration.id, delta=delta)
        return {"status": "queued", "message": f"Shopify {'delta ' if delta else ''}sync started"}
    else:
        # Placeholder for others
        return {"status": "ignored", "message": f"No sync handler for {datasource.slug}"}

@router.post("/verify-integrity/{integration_id}")
async def verify_integration_integrity(
    integration_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(get_current_company_id)
):
    """
    Perform deep health check on integration.
    """
    from app.models.integration import Integration
    from app.models.datasource import DataSource
    from app.services.shopify.sync_service import shopify_sync_service

    # 1. Fetch Integration & Datasource
    integration = await session.get(Integration, integration_id)
    if not integration or integration.company_id != company_id:
        raise HTTPException(status_code=404, detail="Integration not found")
        
    datasource = await session.get(DataSource, integration.datasource_id)
    if not datasource:
         raise HTTPException(status_code=500, detail="Datasource missing")

    if datasource.slug == 'shopify':
        # 2. Trigger Zero-Drift Reconciliation in background
        from app.services.shopify.tasks import run_reconciliation_task
        background_tasks.add_task(run_reconciliation_task, integration_id)
        
        # 3. Return current health report + notify about background audit
        report = await shopify_sync_service.verify_integration_integrity(session, integration_id)
        
        # 4. Immediate Stats Sync: Update metadata_info with these fresh counts so UI is snappy
        meta = integration.metadata_info or {}
        if "sync_stats" not in meta: meta["sync_stats"] = {}
        
        completeness = report.get("data_completeness", {})
        
        meta["sync_stats"].update({
            "orders_count": completeness.get("orders", 0),
            "products_count": completeness.get("products", 0),
            "inventory_count": completeness.get("inventory_items", 0),
            "last_updated": datetime.now(timezone.utc).isoformat()
        })
        
        integration.metadata_info = meta
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(integration, "metadata_info")
        session.add(integration)
        await session.commit()
        
        report["message"] = "Deep integrity audit initiated. Self-healing in progress."
        return report
    else:
        return {"status": "Unsupported", "message": f"Verification not implemented for {datasource.slug}"}

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
