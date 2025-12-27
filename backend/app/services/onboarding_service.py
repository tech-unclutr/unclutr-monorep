from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.models.onboarding_state import OnboardingState, OnboardingStep
from app.models.company import Company, Brand, Workspace
from app.models.iam import CompanyMembership, WorkspaceMembership, SystemRole
from app.models.audit import AuditTrail
from typing import Optional, Dict, Any
import uuid

async def get_or_create_onboarding_state(session: AsyncSession, user_id: str) -> OnboardingState:
    stmt = select(OnboardingState).where(OnboardingState.user_id == user_id)
    result = await session.exec(stmt)
    state = result.first()
    
    if not state:
        state = OnboardingState(user_id=user_id)
        session.add(state)
        await session.commit()
        await session.refresh(state)
    
    return state

async def save_onboarding_step(session: AsyncSession, user_id: str, step: int, data: dict) -> OnboardingState:
    state = await get_or_create_onboarding_state(session, user_id)
    
    if step == OnboardingStep.IDENTITY:
        state.identity_data = data
    elif step == OnboardingStep.STACK:
        state.stack_data = data
    elif step == OnboardingStep.TRUTH_CONFIG:
        state.truth_data = data
        
    state.current_step = max(state.current_step, step + 1)
    session.add(state)
    
    # Audit Log for step progress
    audit = AuditTrail(
        company_id=uuid.UUID("00000000-0000-0000-0000-000000000000"), # System/Pending context
        actor_id=user_id,
        action=f"onboarding.step_{step}_saved",
        resource_type="onboarding_state",
        resource_id=str(state.id),
        event_data={"step": step}
    )
    session.add(audit)
    
    await session.commit()
    await session.refresh(state)
    return state

async def complete_onboarding(session: AsyncSession, user_id: str) -> Company:
    """
    Atomic transaction to commit the onboarding state to the real models.
    """
    state = await get_or_create_onboarding_state(session, user_id)
    
    if state.is_completed:
        raise ValueError("Onboarding already completed.")
    
    # 1. Create Company
    company = Company(
        name=state.identity_data.get("company_name", "My Company"),
        currency=state.identity_data.get("currency", "INR")
    )
    session.add(company)
    await session.flush()
    
    # CRITICAL: Set context so subsequent scoped models (Brand, Workspace, Integration) 
    # pass the Stamping security check.
    from app.core.context import set_company_ctx
    set_company_ctx(company.id)
    
    # 2. Create Brand
    brand = Brand(
        company_id=company.id,
        name=state.identity_data.get("brand_name", company.name)
    )
    session.add(brand)
    await session.flush()
    
    # 3. Create Workspace
    workspace = Workspace(
        company_id=company.id,
        brand_id=brand.id,
        name="Main Workspace",
        timezone=state.identity_data.get("timezone", "UTC")
    )
    session.add(workspace)
    await session.flush()
    
    # 4. Create Memberships
    co_membership = CompanyMembership(
        company_id=company.id,
        user_id=user_id,
        role=SystemRole.OWNER
    )
    ws_membership = WorkspaceMembership(
        workspace_id=workspace.id,
        user_id=user_id,
        role=SystemRole.OWNER
    )
    session.add(co_membership)
    session.add(ws_membership)
    
    # 5. Mark State as Completed
    state.is_completed = True
    session.add(state)
    
    # 6. Audit Log
    audit = AuditTrail(
        company_id=company.id,
        brand_id=brand.id,
        workspace_id=workspace.id,
        actor_id=user_id,
        action="company.created",
        resource_type="company",
        resource_id=str(company.id),
        event_data={"onboarding_id": str(state.id)}
    )
    session.add(audit)
    
    await session.commit()
    await session.refresh(company)
    return company
