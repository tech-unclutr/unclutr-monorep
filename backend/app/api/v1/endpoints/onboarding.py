from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import get_session
from app.core.security import get_current_user
from app.services import onboarding_service
from pydantic import BaseModel
from typing import List, Optional
import uuid

router = APIRouter()

from app.schemas.onboarding_validation import SaveProgressRequest

# DEPRECATED: Old SaveProgressRequest was here
# class SaveProgressRequest(BaseModel):
#     page: str
#     data: dict

class StepData(BaseModel):
    """DEPRECATED: Use SaveProgressRequest instead"""
    step: int
    data: dict

@router.get("/state")
async def get_onboarding_status(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get current onboarding state and resume information.
    
    Frontend uses this to:
    1. Check if onboarding is complete
    2. Determine which page to resume from
    3. Hydrate form fields with saved data
    """
    user_id = current_user.get("uid")
    return await onboarding_service.get_resume_info(session, user_id)

@router.post("/sync")
async def sync_state(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger sync from existing Company -> OnboardingState.
    Used by 'Edit' button in Settings.
    """
    user_id = current_user.get("uid")
    try:
        await onboarding_service.sync_company_to_state(session, user_id)
        return {"status": "synced", "message": "Onboarding state updated from current company data."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/save")
async def save_progress(
    request: SaveProgressRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Save onboarding progress for a specific page.
    Called by 'Save & Exit' button or when navigating between pages.
    
    Does NOT mark onboarding as complete - use /finish for that.
    """
    user_id = current_user.get("uid")
    
    # Validate page
    valid_pages = ['basics', 'channels', 'stack', 'finish']
    if request.page not in valid_pages:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid page. Must be one of: {valid_pages}"
        )
    
    # Convert Pydantic model to dict if necessary
    data_payload = request.data.dict() if hasattr(request.data, 'dict') else request.data
    
    state = await onboarding_service.save_onboarding_progress(
        session, user_id, request.page, data_payload
    )
    
    return {
        "status": "saved",
        "current_page": state.current_page,
        "last_saved_at": state.last_saved_at.isoformat() if state.last_saved_at else None
    }

@router.post("/finish")
async def finish_onboarding(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Complete onboarding and commit all data to production models.
    
    Called when user clicks 'Go to Dashboard' on finish page.
    Creates: Company, Brand, Workspace, Integrations.
    Marks onboarding as complete.
    
    Idempotent: Safe to call multiple times.
    """
    user_id = current_user.get("uid")
    try:
        company = await onboarding_service.complete_onboarding(session, user_id, user_data=current_user)
        return {
            "status": "success",
            "company_id": str(company.id),
            "message": "Onboarding completed successfully"
        }
    except ValueError as e:
        # Already completed - return success
        if "already completed" in str(e).lower():
            raise HTTPException(
                status_code=200,  # Not an error, just informational
                detail=str(e)
            )
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/step")
async def save_step(
    step_data: StepData,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    DEPRECATED: Use /save endpoint instead.
    Kept for backward compatibility.
    
    Maps step numbers to page names:
    - Step 1 → basics
    - Step 2 → channels
    - Step 3 → stack
    - Step 4 → finish
    """
    user_id = current_user.get("uid")
    state = await onboarding_service.save_onboarding_step(
        session, user_id, step_data.step, step_data.data
    )
    return state
