from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from loguru import logger
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_session
from app.core.security import get_current_user
from app.services.brand_service import brand_service

router = APIRouter()

@router.get("/{brand_id}/overview", response_model=Dict[str, Any])
async def get_brand_overview(
    brand_id: UUID,
    session: AsyncSession = Depends(get_session),
    x_company_id: UUID = Header(..., alias="X-Company-ID"),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Get aggregated "Bird's Eye" overview for a brand.
    Triggers 'Zero-Trust' freshness check on all active integrations.
    """
    # Input validation: Verify brand_id is valid UUID (FastAPI does this automatically)
    # Additional validation: Check brand exists
    from app.models.company import Brand
    
    try:
        brand_stmt = select(Brand).where(Brand.id == brand_id)
        brand = (await session.execute(brand_stmt)).scalars().first()
        
        if not brand:
            logger.warning(f"Brand not found: {brand_id}")
            raise HTTPException(status_code=404, detail=f"Brand {brand_id} not found")
        
        # Security: Verify Brand belongs to Company
        if brand.company_id != x_company_id:
            logger.warning(
                f"Access denied: Brand {brand_id} does not belong to company {x_company_id}",
                extra={"brand_id": str(brand_id), "company_id": str(x_company_id)}
            )
            raise HTTPException(status_code=403, detail="Access denied: Brand does not belong to this company")

        metrics = await brand_service.calculate_aggregated_metrics(session, brand_id)
        
        logger.info(
            "Brand overview fetched successfully",
            extra={
                "brand_id": str(brand_id),
                "company_id": str(x_company_id),
                "insights_count": len(metrics.get("heartbeat", {}).get("insights", []))
            }
        )
        
        return metrics
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        logger.error(
            "Error fetching brand overview",
            extra={
                "brand_id": str(brand_id),
                "error": str(e),
                "traceback": error_msg
            }
        )
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
