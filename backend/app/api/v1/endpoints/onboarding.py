from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import get_session
from app.core.security import get_current_user
from app.services import onboarding_service
from pydantic import BaseModel
from typing import List, Optional
import uuid

router = APIRouter()

class StepData(BaseModel):
    step: int
    data: dict

@router.get("/state")
async def get_onboarding_status(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    user_id = current_user.get("uid")
    return await onboarding_service.get_or_create_onboarding_state(session, user_id)

@router.post("/step")
async def save_step(
    step_data: StepData,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    user_id = current_user.get("uid")
    return await onboarding_service.save_onboarding_step(
        session, user_id, step_data.step, step_data.data
    )

@router.post("/finish")
async def finish_onboarding(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    user_id = current_user.get("uid")
    try:
        company = await onboarding_service.complete_onboarding(session, user_id)
        return {"status": "success", "company_id": company.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
