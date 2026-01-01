from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.models.onboarding_state import OnboardingState, OnboardingStep
from app.models.company import Company, Brand, Workspace
from app.models.iam import CompanyMembership, WorkspaceMembership, SystemRole
from app.models.audit import AuditTrail
from typing import Optional, Dict, Any
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

async def get_or_create_onboarding_state(session: AsyncSession, user_id: str) -> OnboardingState:
    """Get or create onboarding state for a user."""
    stmt = select(OnboardingState).where(OnboardingState.user_id == user_id)
    result = await session.exec(stmt)
    state = result.first()
    
    if not state:
        state = OnboardingState(user_id=user_id)
        session.add(state)
        await session.commit()
        await session.refresh(state)
    
    return state

async def save_onboarding_progress(
    session: AsyncSession, 
    user_id: str, 
    page: str,
    data: dict
) -> OnboardingState:
    """
    Save progress for a specific onboarding page.
    Called by 'Save & Exit' or when navigating between pages.
    Does NOT mark onboarding as complete.
    """
    state = await get_or_create_onboarding_state(session, user_id)
    
    # Store data in appropriate field
    if page == 'basics':
        state.basics_data = data
    elif page == 'channels':
        state.channels_data = data
    elif page == 'stack':
        state.stack_data = data
    elif page == 'finish':
        state.finish_data = data
    else:
        raise ValueError(f"Invalid page: {page}")
    
    # Update tracking fields
    state.current_page = page
    state.last_saved_at = datetime.utcnow()
    state.updated_at = datetime.utcnow()
    
    session.add(state)
    
    # Audit Log
    audit = AuditTrail(
        company_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
        actor_id=user_id,
        action=f"onboarding.{page}_saved",
        resource_type="onboarding_state",
        resource_id=str(state.id),
        event_data={"page": page, "data_keys": list(data.keys())}
    )
    session.add(audit)
    
    await session.commit()
    await session.refresh(state)
    return state

async def get_resume_info(session: AsyncSession, user_id: str) -> dict:
    """
    Get information needed to resume onboarding.
    Returns complete state with resume metadata.
    """
    state = await get_or_create_onboarding_state(session, user_id)
    
    return {
        "should_resume": not state.is_completed,
        "current_page": state.current_page,
        "is_completed": state.is_completed,
        "basics_data": state.basics_data,
        "channels_data": state.channels_data,
        "stack_data": state.stack_data,
        "finish_data": state.finish_data,
        "last_saved_at": state.last_saved_at.isoformat() if state.last_saved_at else None,
        "created_at": state.created_at.isoformat() if state.created_at else None
    }

async def _create_integrations_from_onboarding(
    session: AsyncSession,
    workspace_id: uuid.UUID,
    channels_data: dict,
    stack_data: dict
) -> None:
    """
    Create Integration records from onboarding selections.
    All integrations start as INACTIVE until user connects them.
    """
    from app.models.datasource import DataSource
    from app.models.integration import Integration, IntegrationStatus
    
    # Collect all datasource IDs from channels and stack
    datasource_ids = set()
    
    # From channels
    channels = channels_data.get("channels", {})
    for channel_type in ['d2c', 'marketplaces', 'qcom', 'others']:
        ids = channels.get(channel_type, [])
        if isinstance(ids, list):
            datasource_ids.update(ids)
        elif isinstance(ids, str):
            datasource_ids.add(ids)
    
    # From stack
    for category in ['orders', 'payments', 'shipping', 'payouts', 'marketing', 'analytics', 'finance']:
        ids = stack_data.get(category, [])
        if isinstance(ids, list):
            datasource_ids.update(ids)
    
    # Remove empty strings and None
    datasource_ids = {id for id in datasource_ids if id}
    
    if not datasource_ids:
        logger.info("No datasources selected during onboarding")
        return
    
    # Fetch datasources
    stmt = select(DataSource).where(DataSource.id.in_(datasource_ids))
    result = await session.exec(stmt)
    datasources = result.all()
    
    # Create integrations
    for ds in datasources:
        # Check if integration already exists
        check_stmt = select(Integration).where(
            Integration.workspace_id == workspace_id,
            Integration.datasource_id == ds.id
        )
        check_result = await session.exec(check_stmt)
        existing = check_result.first()
        
        if not existing:
            integration = Integration(
                workspace_id=workspace_id,
                datasource_id=ds.id,
                status=IntegrationStatus.INACTIVE,
                credentials={},
                config={}
            )
            session.add(integration)
            logger.info(f"Created integration placeholder for {ds.name}")
        else:
            logger.info(f"Integration for {ds.name} already exists, skipping")
    
    await session.flush()

async def complete_onboarding(session: AsyncSession, user_id: str, user_data: Optional[Dict[str, Any]] = None) -> Company:
    """
    Final commit: Creates Company, Brand, Workspace, Integrations.
    Called when user clicks 'Go to Dashboard' on finish page.
    Marks onboarding as complete.
    """
    # Ensure User exists before creating memberships (FK constraint)
    from app.models.user import User
    
    user_stmt = select(User).where(User.id == user_id)
    user_result = await session.exec(user_stmt)
    user_record = user_result.first()
    
    if not user_record:
        logger.info(f"User {user_id} not found in DB during onboarding completion. Creating now.")
        new_user = User(
            id=user_id,
            email=user_data.get("email") if user_data else f"{user_id}@unclutr.ai", 
            full_name=user_data.get("name") if user_data else "User",
            picture_url=user_data.get("picture") if user_data else None,
            is_active=True
        )
        session.add(new_user)
        await session.flush()

    state = await get_or_create_onboarding_state(session, user_id)
    
    if state.is_completed:
        # If already completed, return existing company
        stmt = select(CompanyMembership).where(CompanyMembership.user_id == user_id)
        result = await session.exec(stmt)
        membership = result.first()
        if membership:
            stmt = select(Company).where(Company.id == membership.company_id)
            result = await session.exec(stmt)
            company = result.first()
            if company:
                logger.info(f"Onboarding already completed for user {user_id}, returning existing company")
                return company
        raise ValueError("Onboarding marked complete but no company found.")
    
    # Extract data from page-based storage
    basics = state.basics_data or {}
    channels = state.channels_data or {}
    stack = state.stack_data or {}
    

    
    # Extract region data
    region = basics.get("region", {})
    
    # 1. Create Company
    company = Company(
        name=basics.get("companyName", "My Company"),
        currency=region.get("currency", "INR"),
        timezone=region.get("timezone", "UTC"),
        industry=basics.get("category"),
        country=region.get("country"),
        stack_summary=stack,
        channels_summary=channels
    )
    session.add(company)
    await session.flush()
    
    # CRITICAL: Set context for stamping
    from app.core.context import set_company_ctx
    set_company_ctx(company.id)

    # Update User completion status
    if user_record:
        user_record.onboarding_completed = True
        session.add(user_record)
    
    # 2. Create Brand
    brand = Brand(
        company_id=company.id,
        name=basics.get("brandName", company.name)
    )
    session.add(brand)
    await session.flush()
    
    # 3. Create Workspace
    workspace = Workspace(
        company_id=company.id,
        brand_id=brand.id,
        name="Main Workspace",
        timezone=region.get("timezone", "UTC")
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
    await session.flush()
    
    # 5. Create Integrations from channels + stack
    await _create_integrations_from_onboarding(
        session, workspace.id, channels, stack
    )
    
    # 6. Mark State as Completed
    state.is_completed = True
    state.current_page = 'finish'
    state.updated_at = datetime.utcnow()
    session.add(state)
    
    # 7. Audit Log
    audit = AuditTrail(
        company_id=company.id,
        brand_id=brand.id,
        workspace_id=workspace.id,
        actor_id=user_id,
        action="onboarding.completed",
        resource_type="company",
        resource_id=str(company.id),
        event_data={
            "onboarding_id": str(state.id),
            "brand_name": brand.name,
            "company_name": company.name,
            "category": basics.get("category")
        }
    )
    session.add(audit)
    
    await session.commit()
    await session.refresh(company)
    
    logger.info(f"Onboarding completed for user {user_id}, created company {company.id}")
    return company

# DEPRECATED: Keep for backward compatibility
async def save_onboarding_step(session: AsyncSession, user_id: str, step: int, data: dict) -> OnboardingState:
    """
    DEPRECATED: Use save_onboarding_progress instead.
    Kept for backward compatibility.
    """
    # Map step numbers to pages
    step_to_page = {
        1: 'basics',
        2: 'channels',
        3: 'stack',
        4: 'finish'
    }
    
    page = step_to_page.get(step, 'basics')
    logger.warning(f"Using deprecated save_onboarding_step, mapped step {step} to page '{page}'")
    
    return await save_onboarding_progress(session, user_id, page, data)
