import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.orm.attributes import flag_modified
from sqlmodel import and_, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.company import Company, Workspace
from app.models.datasource import DataSource
from app.models.iam import CompanyMembership
from app.models.integration import Integration, IntegrationStatus
from app.models.onboarding_state import OnboardingState

logger = logging.getLogger(__name__)

def _remove_targets_recursively(data: Any, targets: List[str]) -> Any:
    """
    Recursively removes a set of target strings (case-insensitive) from lists within a nested structure.
    """
    targets_lower = [t.lower() for t in targets]
    
    if isinstance(data, list):
        filtered = [
            _remove_targets_recursively(item, targets) 
            for item in data 
            if not (isinstance(item, str) and item.lower() in targets_lower)
        ]
        return filtered
    elif isinstance(data, dict):
        filtered = {}
        for k, v in data.items():
            if isinstance(k, str) and k.lower() in targets_lower:
                continue
            filtered[k] = _remove_targets_recursively(v, targets)
        return filtered
    return data

async def _ensure_integrations_sync(session: AsyncSession, company_id: uuid.UUID) -> None:
    """
    Compares the company's stack_data/channels_data with existing Integration records
    and creates INACTIVE integration placeholders for missing ones.
    """
    company = await session.get(Company, company_id)
    if not company:
        return

    # Get primary workspace
    stmt = select(Workspace).where(Workspace.company_id == company_id).limit(1)
    result = await session.exec(stmt)
    workspace = result.first()
    if not workspace:
        return

    # Extract all datasource identifiers from company summaries
    identifiers = set()
    
    # Channels
    if company.channels_data:
        channels = company.channels_data.get("channels", {})
        for cat in ['d2c', 'marketplaces', 'qcom', 'others']:
            items = channels.get(cat, [])
            if isinstance(items, list):
                identifiers.update([str(i) for i in items if i])

    # Stack
    if company.stack_data:
        stack = company.stack_data.get("stack", {})
        for cat, items in stack.items():
            if isinstance(items, list):
                identifiers.update([str(i) for i in items if i])
        
        # Legacy/Flat list support
        selected_tools = company.stack_data.get("selectedTools", [])
        if isinstance(selected_tools, list):
            identifiers.update([str(i) for i in selected_tools if i])
    

    if not identifiers:
        return

    # Separate IDs and Slugs
    ids = set()
    slugs = set()
    for item in identifiers:
        try:
            ids.add(uuid.UUID(item))
        except (ValueError, TypeError):
            slugs.add(item)

    # Fetch DataSources
    stmt = select(DataSource).where(
        (DataSource.id.in_(ids)) | (DataSource.slug.in_(slugs))
    )
    result = await session.exec(stmt)
    datasources = result.all()

    # Get existing integration datasource IDs and their statuses
    stmt = select(Integration).where(Integration.company_id == company_id)
    result = await session.exec(stmt)
    existing_integrations = result.all()
    existing_ds_ids = {i.datasource_id for i in existing_integrations}
    
    changes_detected = False
    
    # 1. Create missing ones
    for ds in datasources:
        if ds.id not in existing_ds_ids:
            new_integration = Integration(
                company_id=company_id,
                workspace_id=workspace.id,
                datasource_id=ds.id,
                status=IntegrationStatus.INACTIVE
            )
            session.add(new_integration)
            changes_detected = True
            logger.info(f"Auto-healed integration entry for {ds.name} (Company: {company_id})")
    
    # 2. Cleanup INACTIVE ones that are no longer in the stack
    intended_ds_ids = {ds.id for ds in datasources}
    for integration in existing_integrations:
        if (integration.status == IntegrationStatus.INACTIVE and 
            integration.datasource_id not in intended_ds_ids):
            try:
                await session.delete(integration)
                changes_detected = True
                logger.info(f"Cleanup integration placeholder for {integration.datasource_id} (Not in stack, Company: {company_id})")
            except Exception as e:
                logger.warning(f"Failed to cleanup INACTIVE integration {integration.id}: {e}")
                await session.rollback()
                # If rollback happened, we must re-fetch company etc. but since we are at the end, we can just return
                return
    
    if changes_detected:
        await session.flush()
        await session.commit()
    else:
        # Just flush if no explicit changes were added to session manually here, 
        # but in most cases we don't even need to flush.
        pass

async def get_integrations_for_company(session: AsyncSession, company_id: uuid.UUID) -> List[Dict[str, Any]]:
    """
    Fetch integrations for a company, enriched with DataSource details.
    Also includes all implemented datasources for the "Other Datasources" section.
    """
    # 0. Ensure Integrations exist for everything in Company stack
    await _ensure_integrations_sync(session, company_id)

    # 1. Get company and extract stack identifiers for in_stack flag
    company = await session.get(Company, company_id)
    stack_identifiers = set()
    
    if company:
        # Channels
        if company.channels_data:
            channels = company.channels_data.get("channels", {})
            for cat in ['d2c', 'marketplaces', 'qcom', 'others']:
                items = channels.get(cat, [])
                if isinstance(items, list):
                    stack_identifiers.update([str(i).lower() for i in items if i])

        # Stack
        if company.stack_data:
            stack = company.stack_data.get("stack", {})
            for cat, items in stack.items():
                if isinstance(items, list):
                    stack_identifiers.update([str(i).lower() for i in items if i])
            
            # Legacy/Flat list support
            selected_tools = company.stack_data.get("selectedTools", [])
            if isinstance(selected_tools, list):
                stack_identifiers.update([str(i).lower() for i in selected_tools if i])

    # 2. Fetch Integration records joined with DataSource (for My Datastack)
    stmt = (
        select(Integration, DataSource)
        .join(DataSource, Integration.datasource_id == DataSource.id)
        .where(Integration.company_id == company_id)
    )
    result = await session.exec(stmt)
    integrations_with_ds = result.all()
    
    # 3. Fetch ALL implemented datasources (for Other Datasources section)
    stmt = select(DataSource).where(DataSource.is_implemented == True).limit(100)
    result = await session.exec(stmt)
    all_implemented_datasources = {ds.id: ds for ds in result.all()}
    
    # 4. Create a set of datasource IDs that already have integrations
    existing_datasource_ids = {integration.datasource_id for integration, _ in integrations_with_ds}
    
    # 5. Format response with in_stack flag
    formatted = []
    
    # Add datasources with integration records
    for integration, datasource in integrations_with_ds:
        # If an integration record exists, check if it's actually in the stack summaries
        # This is for UI categorization purposes. Active ones are always in stack.
        if integration.status != IntegrationStatus.INACTIVE:
            is_in_stack = True
        else:
            is_in_stack = (
                str(datasource.id).lower() in stack_identifiers or
                datasource.slug.lower() in stack_identifiers
            )
        
        # Prepare metadata safely
        meta = integration.metadata_info or {}
        
        formatted.append({
            "id": str(integration.id),
            "status": integration.status,
            "in_stack": is_in_stack,
            "last_sync_at": integration.last_sync_at,
            "error_message": integration.error_message,
            "metadata_info": meta,
            "datasource": {
                "id": str(datasource.id),
                "name": datasource.name,
                "slug": datasource.slug,
                "logo_url": datasource.logo_url,
                "category": datasource.category,
                "description": datasource.description,
                "is_implemented": datasource.is_implemented,
            },
            "stats": {
                "records_count": meta.get("sync_stats", {}).get("orders_count", meta.get("records_count", 0)),
                "sync_success_rate": meta.get("sync_success_rate", 100.0),
                "health": "healthy" if integration.status == IntegrationStatus.ACTIVE else "warning"
            }
        })
    
    # Add implemented datasources that don't have integration records yet (for Other Datasources)
    for datasource_id, datasource in all_implemented_datasources.items():
        if datasource_id not in existing_datasource_ids:
            # Check if this datasource is in the company's stack/channels
            is_in_stack = (
                str(datasource.id).lower() in stack_identifiers or
                datasource.slug.lower() in stack_identifiers
            )
            
            formatted.append({
                "id": None,
                "status": "not_in_stack",
                "in_stack": is_in_stack,
                "last_sync_at": None,
                "error_message": None,
                "datasource": {
                    "id": str(datasource.id),
                    "name": datasource.name,
                    "slug": datasource.slug,
                    "logo_url": datasource.logo_url,
                    "category": datasource.category,
                    "description": datasource.description,
                    "is_implemented": datasource.is_implemented,
                },
                "stats": {
                    "records_count": 0,
                    "sync_success_rate": 100.0,
                    "health": "warning"
                }
            })
    
    return formatted

async def connect_integration(session: AsyncSession, company_id: uuid.UUID, slug: str) -> Integration:
    """
    Stub for connecting an integration. 
    Sets status to ACTIVE for now to simulate connection.
    """
    # 1. Find the DataSource by slug
    stmt = select(DataSource).where(DataSource.slug == slug)
    result = await session.exec(stmt)
    datasource = result.first()
    
    if not datasource:
        raise ValueError(f"DataSource with slug '{slug}' not found.")
        
    # 2. Get the primary workspace for this company
    stmt = select(Workspace).where(Workspace.company_id == company_id).limit(1)
    result = await session.exec(stmt)
    workspace = result.first()
    
    if not workspace:
        raise ValueError("No workspace found for company.")

    # 3. Get or Create Integration
    stmt = select(Integration).where(
        and_(
            Integration.company_id == company_id,
            Integration.datasource_id == datasource.id
        )
    )
    result = await session.exec(stmt)
    integration = result.first()
    
    if not integration:
        integration = Integration(
            company_id=company_id,
            workspace_id=workspace.id,
            datasource_id=datasource.id,
            status=IntegrationStatus.ACTIVE,
            last_sync_at=datetime.now(timezone.utc)
        )
        session.add(integration)
    else:
        integration.status = IntegrationStatus.ACTIVE
        integration.last_sync_at = datetime.now(timezone.utc)
        session.add(integration)
        
    await session.commit()
    await session.refresh(integration)
    return integration

async def disconnect_integration(session: AsyncSession, company_id: uuid.UUID, integration_id: uuid.UUID) -> Optional[Integration]:
    """
    Marks an integration as inactive (representing a disconnect request) or removes it if never connected.
    """
    # Use selectinload to get datasource details if needed, though here we mostly need the records.
    integration = await session.get(Integration, integration_id)
    if not integration or integration.company_id != company_id:
        raise ValueError("Integration not found or unauthorized.")
        
    if integration.status == IntegrationStatus.ACTIVE:
        # Reset to INACTIVE and clear credentials (State 0)
        integration.status = IntegrationStatus.INACTIVE
        integration.credentials = {} 
        integration.error_message = None
        integration.last_sync_at = None
        session.add(integration)
        await session.commit()
        await session.refresh(integration)
        logger.info(f"Disconnected and reset integration {integration_id} to INACTIVE (State 0)")
        return integration
    else:
        # If it was never connected (INACTIVE) or already in error/requested state, 
        # we surgically remove it from the stack.
        
        # 1. Targets for removal
        # We MUST use the ID (UUID string) as much as possible to avoid global slug removal
        # unless it's the LAST integration of that type.
        datasource = await session.get(DataSource, integration.datasource_id)
        if not datasource:
             await session.delete(integration)
             await session.commit()
             return None

        # Check if other integrations of this type exist for this company
        stmt = select(Integration).where(
            Integration.company_id == company_id,
            Integration.datasource_id == datasource.id,
            Integration.id != integration_id
        )
        res = await session.exec(stmt)
        other_exists = res.first() is not None
        
        # Only remove the slug globally if this is the last one
        targets = [str(integration.id)]
        if not other_exists:
            targets.append(datasource.slug)
            targets.append(str(datasource.id))
            
            
        # 2. Cleanup Company Summaries (stack_data, channels_data)
        company = await session.get(Company, company_id)
        if company:
            if company.stack_data:
                company.stack_data = _remove_targets_recursively(company.stack_data, targets)
                flag_modified(company, "stack_data")
            if company.channels_data:
                company.channels_data = _remove_targets_recursively(company.channels_data, targets)
                flag_modified(company, "channels_data")
            session.add(company)

        # 3. Cleanup OnboardingState for all company members
        stmt = select(CompanyMembership.user_id).where(CompanyMembership.company_id == company_id)
        result = await session.exec(stmt)
        user_ids = result.all()
        
        if user_ids:
            stmt = select(OnboardingState).where(OnboardingState.user_id.in_(user_ids))
            result = await session.exec(stmt)
            states = result.all()
            
            for state in states:
                if state.channels_data:
                    state.channels_data = _remove_targets_recursively(state.channels_data, targets)
                    flag_modified(state, "channels_data")
                if state.stack_data:
                    state.stack_data = _remove_targets_recursively(state.stack_data, targets)
                    flag_modified(state, "stack_data")
                session.add(state)
        
        # 4. Delete the integration record entirely
        await session.delete(integration)
        await session.commit()
        return None



async def add_manual_datasource(session: AsyncSession, company_id: uuid.UUID, slug: str, category: str) -> Dict[str, Any]:
    """
    Adds a datasource to the company's stack_summary if not already present,
    and creates an integration placeholder.
    """
    # 1. Get Company
    company = await session.get(Company, company_id)
    if not company:
        raise ValueError("Company not found.")
        
    # 2. Update stack_data if needed
    if not company.stack_data:
        company.stack_data = {"stack": {}}
    
    # Ensure nested "stack" key exists
    if "stack" not in company.stack_data:
        company.stack_data["stack"] = {}
        
    stack = company.stack_data["stack"]
    if category not in stack:
        stack[category] = []
    
    if slug not in stack[category]:
        stack[category].append(slug)
        company.stack_data["stack"] = stack
        flag_modified(company, "stack_data")
        session.add(company)
        
    # 3. Ensure Integration record exists
    # Find DataSource
    stmt = select(DataSource).where(DataSource.slug == slug)
    result = await session.exec(stmt)
    datasource = result.first()
    
    if not datasource:
        # If datasource doesn't exist in DB, we'll create a stub or handle later.
        # For now, let's assume it exists or fail.
        raise ValueError(f"DataSource with slug '{slug}' not found in catalog.")

    # Get Workspace
    stmt = select(Workspace).where(Workspace.company_id == company_id).limit(1)
    result = await session.exec(stmt)
    workspace = result.first()
    
    stmt = select(Integration).where(
        and_(Integration.company_id == company_id, Integration.datasource_id == datasource.id)
    )
    result = await session.exec(stmt)
    integration = result.first()
    
    if not integration:
        integration = Integration(
            company_id=company_id,
            workspace_id=workspace.id,
            datasource_id=datasource.id,
            status=IntegrationStatus.INACTIVE
        )
        session.add(integration)

    await session.commit()
    return {"status": "added", "slug": slug, "category": category}
