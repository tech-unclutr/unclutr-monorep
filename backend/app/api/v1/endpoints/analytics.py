from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_session
from app.core.security import get_current_user
from app.models.integration import Integration
from app.services.analytics.service import AnalyticsService

router = APIRouter()

@router.get("/overview/{integration_id}")
async def get_analytics_overview(
    integration_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Standardized overview for any integration type.
    """
    # Verify integration belongs to user's company (simplified for now)
    stmt = select(Integration).where(Integration.id == integration_id)
    integration = (await session.execute(stmt)).scalars().first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    return await AnalyticsService.get_overview(session, integration)

@router.get("/daily/{integration_id}")
async def get_daily_analytics(
    integration_id: UUID,
    days: int = Query(default=30, ge=1, le=90),
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """
    Standardized daily time-series data for any integration.
    """
    return await AnalyticsService.get_daily_metrics(session, integration_id, days)
