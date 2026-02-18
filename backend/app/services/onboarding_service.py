import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.audit import AuditTrail
from app.models.company import Brand, Company, Workspace
from app.models.iam import CompanyMembership, SystemRole, WorkspaceMembership
from app.models.onboarding_state import OnboardingState

logger = logging.getLogger(__name__)

async def sync_company_to_state(session: AsyncSession, user_id: str) -> OnboardingState:
    """
    Syncs the current Company data back into the OnboardingState.
    Used when a user wants to 'Edit' their setup from Settings.
    Resets 'is_completed' to False so frontend allows re-entry.
    """
    # 1. Find User's Company
    stmt = select(CompanyMembership).where(CompanyMembership.user_id == user_id)
    result = await session.exec(stmt)
    membership = result.first()
    
    if not membership:
        logger.warning(f"SYNC FAILED: No CompanyMembership found for user {user_id}")
        raise ValueError("No company found to sync from.")

    stmt = select(Company).where(Company.id == membership.company_id).options(selectinload(Company.brands)) # eager load brands
    result = await session.exec(stmt)
    company = result.first()
    
    if not company:
        logger.warning(f"SYNC FAILED: Company record missing for id {membership.company_id}")
        raise ValueError("Company record missing.")

    logger.info(f"SYNC DEBUG: Found Company {company.id} for user {user_id}. Name: '{company.legal_name}', Brand: '{company.brand_name}'")
    
    # 2. Get or Create State
    state = await get_or_create_onboarding_state(session, user_id)
    
    # CRITICAL FIX: Always sync if requested (User "Always sync from Company table")
    if not state.is_completed and state.basics_data:
        logger.info(f"Skipping sync for user {user_id} - active draft exists.")
        return state

    # 3. Map Data Back
    # Basics
    brand_name = company.brand_name
    if company.brands and len(company.brands) > 0:
        brand_name = company.brands[0].name
        
    basics_data = {
        "companyName": company.legal_name or company.brand_name, # Fallback if legal_name not set
        "brandName": brand_name,
        "category": company.industry,
        "region": {
            "country": company.country,
            "currency": company.currency,
            "timezone": company.timezone
        }
    }
    
    # Channels & Stack (Direct copy as we store them as JSON)
    channels_data = company.channels_data or {}
    stack_data = company.stack_data or {}
    
    # 4. Update State
    state.basics_data = basics_data
    state.channels_data = channels_data
    state.stack_data = stack_data
    state.is_completed = False # Allow re-entry
    state.current_page = 'basics' # Reset to start
    state.updated_at = datetime.utcnow()
    
    session.add(state)
    await session.commit()
    await session.refresh(state)
    
    logger.info(f"Synced company {company.id} back to onboarding state for user {user_id}")
    return state


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
    logger.info(f"Saving onboarding progress for page {page}. Data keys: {list(data.keys())}")
    if page == 'basics':
        logger.info(f"Basics Data Region: {data.get('region')}")
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
    state.is_completed = False # CRITICAL: Ensure we are in 'draft' mode if we are saving progress
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
    
    # --- REAL-TIME SYNC TO COMPANY TABLE ---
    # Per user request: "save the data in our db wherever relevant"
    # If the user ALREADY has a company (e.g. Editing or Resuming), update it immediately.
    # If they are new (no company), we still wait for Finish (to avoid ghost records).
    
    stmt = select(CompanyMembership).where(CompanyMembership.user_id == user_id)
    result = await session.exec(stmt)
    membership = result.first()
    
    if membership:
        stmt = select(Company).where(Company.id == membership.company_id)
        result = await session.exec(stmt)
        company = result.first()
        
        if company:
            logger.info(f"Real-time syncing onboarding data to Company {company.id}")
            
            if page == 'basics':
                company.legal_name = data.get("companyName", company.legal_name)
                company.brand_name = data.get("brandName", company.brand_name)
                company.industry = data.get("category", company.industry)
                
                region = data.get("region") or {}
                company.country = region.get("country", company.country)
                company.currency = region.get("currency", company.currency)
                company.timezone = region.get("timezone", company.timezone)
                
                # Check/Update Brand
                stmt = select(Brand).where(Brand.company_id == company.id)
                res = await session.exec(stmt)
                brand = res.first()
                if brand:
                    brand.name = data.get("brandName", brand.name)
                    session.add(brand)
                    
                # Check/Update Workspace (Timezone)
                stmt = select(Workspace).where(Workspace.company_id == company.id)
                res = await session.exec(stmt)
                workspace = res.first()
                if workspace:
                    workspace.timezone = region.get("timezone", workspace.timezone)
                    session.add(workspace)

            elif page == 'channels':
                company.channels_data = data
                
            elif page == 'stack':
                company.stack_data = data
                
            session.add(company)
    
    await session.commit()
    await session.refresh(state)
    return state

async def get_resume_info(session: AsyncSession, user_id: str) -> dict:
    """
    Get information needed to resume onboarding.
    Returns complete state with resume metadata.
    """
    state = await get_or_create_onboarding_state(session, user_id)
    
    # Auto-Sync: ALWAYS try to pull from Company as per user request
    # This ensures we always show the "Source of Truth"
    # Even if completed, we sync so the user sees fresh data if they revisit the flow
    try:
        logger.info(f"Auto-syncing company data for user {user_id} (FORCE SYNC)")
        state = await sync_company_to_state(session, user_id)
    except ValueError:
        # User likely has no company yet, which is normal for fresh signups
        pass
    
    # --- CRITICAL: Normalize Categories ---
    # Fixes issue where Stack tools (Razorpay) appear in Channels (Other Tools) 
    # instead of their correct stack bucket, causing them to be unselected in Step 3.
    state = await _normalize_onboarding_state(session, state)

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
    company_id: uuid.UUID,
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
    stack = stack_data.get("stack", {})
    for category in ['orders', 'payments', 'shipping', 'payouts', 'marketing', 'analytics', 'finance']:
        ids = stack.get(category, [])
        if isinstance(ids, list):
            datasource_ids.update(ids)
    
    # Remove empty strings and None
    datasource_ids = {id for id in datasource_ids if id}
    
    if not datasource_ids:
        logger.info("No datasources selected during onboarding")
        return
    
    # Separate IDs (UUIDs) and Slugs
    ds_ids = set()
    ds_slugs = set()
    
    for item in datasource_ids:
        try:
            # Try parsing as UUID
            ds_ids.add(uuid.UUID(str(item)))
        except (ValueError, TypeError):
            # Otherwise treat as slug
            ds_slugs.add(str(item))
    
    # Fetch datasources by SLUG or ID
    stmt = select(DataSource).where(
        (DataSource.slug.in_(ds_slugs)) | (DataSource.id.in_(ds_ids))
    )
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
                company_id=company_id,
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
    Commit all onboarding data to production models.
    Called when user clicks 'Go to Dashboard' on finish page.
    """
    logger.info(f"START: complete_onboarding for user {user_id}")
    try:
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
    
        # Check for existing Company via Membership
        stmt = select(CompanyMembership).where(CompanyMembership.user_id == user_id)
        result = await session.exec(stmt)
        membership = result.first()
    
        company = None
        brand = None
        workspace = None
    
        # Extract data from page-based storage
        basics = state.basics_data or {}
        channels = state.channels_data or {}
        stack = state.stack_data or {}
    
        # Extract region data
        region = basics.get("region", {})
    
        if membership:
            # UPDATE EXISTING
            stmt = select(Company).where(Company.id == membership.company_id)
            result = await session.exec(stmt)
            company = result.first()
        
            if company:
                logger.info(f"Updating existing company {company.id} for user {user_id}")
                # Only update if new values are provided (prevent overwriting with None/Empty)
                new_brand_name = basics.get("brandName")
                if new_brand_name:
                    company.brand_name = new_brand_name
                    
                company.legal_name = basics.get("companyName", company.legal_name)
                company.currency = region.get("currency", company.currency)
                company.timezone = region.get("timezone", company.timezone)
                company.industry = basics.get("category", company.industry)
                company.country = region.get("country", company.country)
                company.stack_data = stack
                company.channels_data = channels
                session.add(company)
            
                # Update Brand (assume primary brand)
                stmt = select(Brand).where(Brand.company_id == company.id)
                result = await session.exec(stmt)
                brand = result.first()
                if brand:
                    if new_brand_name:
                        brand.name = new_brand_name
                    session.add(brand)
                
                # Update Workspace (assume primary)
                stmt = select(Workspace).where(Workspace.company_id == company.id)
                result = await session.exec(stmt)
                workspace = result.first()
                if workspace:
                    workspace.timezone = region.get("timezone", workspace.timezone)
                    session.add(workspace)
                
                await session.flush()
    
        if not company:
            # CREATE NEW
            logger.info(f"Creating new company for user {user_id}")
            company = Company(
                brand_name=basics.get("brandName", "My Brand"),
                legal_name=basics.get("companyName", "My Company"),
                currency=region.get("currency", "INR"),
                timezone=region.get("timezone", "UTC"),
                industry=basics.get("category"),
                country=region.get("country"),
                stack_data=stack,
                channels_data=channels,
                created_by=user_id, # Req 6: Link User to Company
                updated_by=user_id
            )
            session.add(company)
            await session.flush()
        
            # 2. Create Brand
            brand = Brand(
                company_id=company.id,
                name=basics.get("brandName", company.brand_name),
                created_by=user_id, # Req 6: Link User to Brand
                updated_by=user_id
            )
            session.add(brand)
            await session.flush()
        
            # 3. Create Workspace
            workspace = Workspace(
                company_id=company.id,
                brand_id=brand.id,
                name="Default",
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
            session, company.id, workspace.id, channels, stack
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
                "company_name": company.legal_name,
                "category": basics.get("category")
            }
        )
        session.add(audit)
    
        # 8. Update User Status
        if user_record:
            user_record.onboarding_completed = True
            session.add(user_record)
        else:
            # Fallback if user_record wasn't set (e.g. strict new user flow), though it should be handled above.
            # But wait, code above creates `new_user` but doesn't assign to `user_record`.
            # Let's just fetch or update via ID to be safe, or assume strict flow.
            # Actually safer to just get via ID again or use the reference if we fixed assignments.
            # For this edit, I'll rely on user_id.
            user_update_stmt = select(User).where(User.id == user_id)
            u_res = await session.exec(user_update_stmt)
            u_obj = u_res.first()
            if u_obj:
                u_obj.onboarding_completed = True
                session.add(u_obj)

        await session.commit()
        await session.refresh(company)
        await session.refresh(brand)
        await session.refresh(workspace)
    
        logger.info(f"SUCCESS: Onboarding completed for user {user_id}. Created Company {company.id}, Brand {brand.id}, Workspace {workspace.id}")
        return company

    except Exception as e:
        logger.error(f"ERROR: complete_onboarding failed for user {user_id}: {str(e)}", exc_info=True)
        raise e

async def save_onboarding_step(
    session: AsyncSession, 
    user_id: str, 
    step: int,
    data: dict
) -> OnboardingState:
    """
    DEPRECATED: Use save_onboarding_progress instead.
    Saves data for a specific onboarding step.
    """
    step_to_page = {
        1: 'basics',
        2: 'channels',
        3: 'stack',
        4: 'finish'
    }
    page = step_to_page.get(step, 'basics')
    logger.warning(f"Using deprecated save_onboarding_step, mapped step {step} to page '{page}'")
    
    return await save_onboarding_progress(session, user_id, page, data)


async def _normalize_onboarding_state(session: AsyncSession, state: OnboardingState) -> OnboardingState:
    """
    Inspects all selected tool IDs in state (channels + stack), queries their actual category
    from DataSource table, and moves them to the correct bucket in state.
    
    This fixes "drift" where tools selected in "Connect Channels" (which puts them in channels.others)
    should actually be in "Stack -> Payment" etc.
    """
    from app.models.datasource import DataSource
    
    # 1. Collect all currently selected IDs
    all_ids = set()
    
    # Helper to extract IDs from potentially nested dicts
    def extract_ids(data_dict):
        ids = set()
        if not data_dict: return ids
        for key, val in data_dict.items():
            if isinstance(val, list):
                ids.update(val)
            elif isinstance(val, str) and val:
                ids.add(val)
        return ids

    channels = state.channels_data.get("channels", {}) if state.channels_data else {}
    stack = state.stack_data.get("stack", {}) if state.stack_data else {}
    
    all_ids.update(extract_ids(channels))
    all_ids.update(extract_ids(stack))
    
    # Remove empty strings
    all_ids = {id for id in all_ids if id}
    
    if not all_ids:
        return state

    # 2. Fetch DataSources to get authoritative categories
    # Handle UUID vs Slug
    ds_ids = set()
    ds_slugs = set()
    for item in all_ids:
        try:
            ds_ids.add(uuid.UUID(str(item)))
        except (ValueError, TypeError):
            ds_slugs.add(str(item))
            
    stmt = select(DataSource).where(
        (DataSource.id.in_(ds_ids)) | (DataSource.slug.in_(ds_slugs))
    )
    result = await session.exec(stmt)
    datasources = result.all()
    
    # 3. Re-bucket
    # New buckets
    new_channels = {
        "d2c": [], "marketplaces": [], "qcom": [], "others": []
    }
    new_stack = {
        "orders": [], "payments": [], "shipping": [], "payouts": [], "marketing": [], "analytics": [], "finance": []
    }
    
    # Mappings
    # "Storefront", "Marketplace", "QuickCommerce" -> Channels
    # "Logistics", "Payment", "Payouts", "Marketing", "Analytics", "Accounting" -> Stack
    # Others -> channels.others or stack.others? Usually channels.
    
    dirty = False
    
    for ds in datasources:
        ds_id = str(ds.id)
        cat = ds.category
        
        # Determine target bucket
        target_bin = None
        target_dict = None # new_channels or new_stack
        
        if cat == "Storefront":
            target_dict = new_channels
            target_bin = "d2c"
        elif cat == "Marketplace":
            target_dict = new_channels
            target_bin = "marketplaces"
        elif cat == "QuickCommerce":
            target_dict = new_channels
            target_bin = "qcom"
        elif cat == "Logistics":
            target_dict = new_stack
            target_bin = "shipping"
        elif cat == "Payment":
            target_dict = new_stack
            target_bin = "payments"
        elif cat == "Payouts":
            target_dict = new_stack
            target_bin = "payouts"
        elif cat == "Marketing":
            target_dict = new_stack
            target_bin = "marketing"
        elif cat == "Analytics" or cat == "Retention" or cat == "Communication":
            target_dict = new_stack
            target_bin = "analytics"
        elif cat == "Accounting":
            target_dict = new_stack
            target_bin = "finance"
        else:
            # Fallback for "Network", "SocialCommerce", etc.
            target_dict = new_channels
            target_bin = "others"
            
        # Add to target
        if target_dict is not None and target_bin is not None:
            if ds_id not in target_dict[target_bin]:
                target_dict[target_bin].append(ds_id)
                
    # 4. Compare with old state to see if we need to save
    # We reconstruct the 'data' wrappers
    
    # Preserve primaryPartners as they are distinct
    primary_partners = state.channels_data.get("primaryPartners", {}) if state.channels_data else {}
    
    new_channels_data = {
        "channels": new_channels,
        "primaryPartners": primary_partners
    }
    new_stack_data = {
        "stack": new_stack
    }
    
    # Detect changes (simple stringify comparison or just deep compare)
    import json
    # Use sort_keys to ensure consistent ordering for comparison
    def stable_json(obj): return json.dumps(obj, sort_keys=True)
    
    old_c = state.channels_data or {}
    old_s = state.stack_data or {}
    
    # We only care if the "channels" dictionary inside channels_data changed, 
    # or "stack" inside stack_data changed.
    # But since we reconstructed the WHOLE structure (except primaryPartners which we kept),
    # we can compare the constructed parts.
    
    # Actually, simplistic comparison:
    if stable_json(new_channels_data) != stable_json(old_c) or stable_json(new_stack_data) != stable_json(old_s):
        logger.info("Normalization detected improperly categorized tools. Fixing state...")
        state.channels_data = new_channels_data
        state.stack_data = new_stack_data
        session.add(state)
        await session.commit()
        await session.refresh(state)
        
    return state
