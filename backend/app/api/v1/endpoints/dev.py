from fastapi import APIRouter, Depends, HTTPException, Request
from sse_starlette.sse import EventSourceResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, delete
from app.core.db import get_session, engine
from app.core.security import get_current_user
from app.models.audit import AuditTrail
from app.models.onboarding_state import OnboardingState
from app.models.company import Company, Brand, Workspace
from app.models.iam import CompanyMembership, WorkspaceMembership
import asyncio
import json

router = APIRouter()

async def audit_log_generator(request: Request):
    """
    Generator that polls for new audit logs and streams them via SSE.
    """
    last_id = None
    while True:
        if await request.is_disconnected():
            break

        async with AsyncSession(engine) as session:
            stmt = select(AuditTrail).order_by(AuditTrail.created_at.desc()).limit(10)
            result = await session.exec(stmt)
            logs = result.all()
            
            if logs:
                # If we have a last_id, only stream new logs
                new_logs = []
                if last_id:
                    for log in logs:
                        if str(log.id) == last_id:
                            break
                        new_logs.append(log)
                else:
                    new_logs = logs
                
                if new_logs:
                    last_id = str(new_logs[0].id)
                    for log in reversed(new_logs):
                        yield {
                            "event": "audit_log",
                            "data": json.dumps({
                                "id": str(log.id),
                                "action": log.action,
                                "resource_type": log.resource_type,
                                "actor_id": log.actor_id,
                                "created_at": log.created_at.isoformat(),
                                "event_data": log.event_data
                            })
                        }
        
        await asyncio.sleep(2) # Poll every 2 seconds

@router.get("/events")
async def stream_events(request: Request):
    return EventSourceResponse(audit_log_generator(request))

@router.post("/reset-onboarding")
async def reset_onboarding(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Resets onboarding state for the current user.
    """
    user_id = current_user.get("uid")
    # Delete onboarding state
    stmt = delete(OnboardingState).where(OnboardingState.user_id == user_id)
    await session.exec(stmt)
    await session.commit()
    return {"status": "success", "message": "Onboarding state reset."}

@router.post("/purge-data")
async def purge_data(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Hard purge of all data associated with the current user's companies.
    DANGER: Dev only.
    """
    user_id = current_user.get("uid")
    
    # 1. Find all companies where user is owner
    stmt = select(CompanyMembership).where(
        CompanyMembership.user_id == user_id,
        CompanyMembership.role == "owner"
    )
    result = await session.exec(stmt)
    memberships = result.all()
    company_ids = [m.company_id for m in memberships]
    
    if not company_ids:
        return {"status": "success", "message": "No data to purge."}
    
    # Bypass isolation context for mass delete
    from app.core.context import set_company_ctx
    set_company_ctx(None)
    
    # Delete in order of dependencies
    # This is a bit brute force for dev
    for company_id in company_ids:
        # We delete everything stamped with this company_id
        # Note: Audit trail is kept for history
        await session.exec(delete(WorkspaceMembership).where(WorkspaceMembership.workspace_id.in_(
            select(Workspace.id).where(Workspace.company_id == company_id)
        )))
        await session.exec(delete(Workspace).where(Workspace.company_id == company_id))
        await session.exec(delete(Brand).where(Brand.company_id == company_id))
        await session.exec(delete(CompanyMembership).where(CompanyMembership.company_id == company_id))
        await session.exec(delete(Company).where(Company.id == company_id))
        
    await session.commit()
    return {"status": "success", "message": f"Purged data for {len(company_ids)} companies."}
