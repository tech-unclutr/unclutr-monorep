from typing import Any, List, Dict, Set
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from sqlalchemy.orm import selectinload
import uuid

from app.core.db import get_session
from app.core.security import get_current_user
from app.models.company import Company, Brand
from app.models.iam import CompanyMembership
from app.models.datasource import DataSource
from app.schemas.settings import (
    OnboardingSettingsResponse,
    RegionSettings,
    ChannelSettings,
    StackSettings
)

router = APIRouter()

@router.get("/onboarding", response_model=OnboardingSettingsResponse)
async def get_onboarding_settings(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
) -> Any:
    """
    Get onboarding settings for the current user's company.
    Resolves DataSource UUIDs into human-readable names.
    Captures unmapped keys into 'others'.
    """
    user_id = current_user.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="User Identity Not Found")

    # 1. Resolve Company
    statement = (
        select(CompanyMembership)
        .where(CompanyMembership.user_id == user_id)
        .order_by(CompanyMembership.created_at)
        .limit(1)
    )
    result = await session.exec(statement)
    membership = result.first()

    if not membership:
         raise HTTPException(status_code=404, detail="No Company Found for User")
    
    # 2. Fetch Company details
    company_stmt = (
        select(Company)
        .where(Company.id == membership.company_id)
        .options(selectinload(Company.brands))
    )
    company_res = await session.exec(company_stmt)
    company = company_res.first()

    if not company:
        raise HTTPException(status_code=404, detail="Company Not Found")

    # 3. Transform Data & Resolve Names
    channels_data = company.channels_summary or {}
    stack_data = company.stack_summary or {}

    # Normalize data if nested (fix for wrapped payload from onboarding)
    if "channels" in channels_data and isinstance(channels_data["channels"], dict):
        channels_data = channels_data["channels"]
    
    if "stack" in stack_data and isinstance(stack_data["stack"], dict):
        stack_data = stack_data["stack"]
    
    # Collect all likely UUIDs
    all_raw_ids: Set[str] = set()
    
    def collect_ids(data_map: Dict):
        for val_list in data_map.values():
            if isinstance(val_list, list):
                for item in val_list:
                    if isinstance(item, str) and len(item) > 20: 
                        all_raw_ids.add(item)

    collect_ids(channels_data)
    collect_ids(stack_data)

    # 4. Batch Query DataSource table
    id_name_map: Dict[str, str] = {}
    
    if all_raw_ids:
        valid_uuids = []
        for raw_id in all_raw_ids:
            try:
                valid_uuids.append(uuid.UUID(raw_id))
            except ValueError:
                pass
        
        if valid_uuids:
            ds_stmt = select(DataSource).where(DataSource.id.in_(valid_uuids))
            ds_results = await session.exec(ds_stmt)
            for ds in ds_results.all():
                 id_name_map[str(ds.id)] = ds.name

    # 5. Helper to replace IDs with Names
    def resolve_names(data_map: Dict) -> Dict[str, List[str]]:
        resolved_map = {}
        for category, items in data_map.items():
            if not isinstance(items, list):
                resolved_map[category] = []
                continue
            
            new_list = []
            for item in items:
                new_list.append(id_name_map.get(str(item), item))
            resolved_map[category] = new_list
        return resolved_map

    resolved_channels = resolve_names(channels_data)
    resolved_stack = resolve_names(stack_data)

    # 6. Aggregate 'Others' (Catch-all)
    # Channels Known Keys
    channel_keys = {"d2c", "marketplaces", "qcom", "others"}
    # Stack Known Keys
    stack_keys = {"orders", "payments", "shipping", "payouts", "marketing", "analytics", "finance", "others"}

    # Helper to gather extras
    def gather_extras(resolved_map: Dict, known_keys: Set[str]) -> List[str]:
        extras = []
        for key, val_list in resolved_map.items():
            if key not in known_keys and isinstance(val_list, list):
                extras.extend(val_list)
        return extras

    channel_extras = gather_extras(resolved_channels, channel_keys)
    stack_extras = gather_extras(resolved_stack, stack_keys)

    # Merge extras into existing 'others' list if present
    final_channel_others = resolved_channels.get("others", []) + channel_extras
    final_stack_others = resolved_stack.get("others", []) + stack_extras

    # Remove duplicates if any
    final_channel_others = list(set(final_channel_others))
    final_stack_others = list(set(final_stack_others))

    # Determine Brand Name
    brand_name = company.brand_name
    if company.brands and len(company.brands) > 0:
        brand_name = company.brands[0].name

    return OnboardingSettingsResponse(
        companyName=company.brand_name,
        brandName=brand_name,
        category=company.industry,
        region=RegionSettings(
            country=company.country,
            currency=company.currency,
            timezone=company.timezone
        ),
        channels=ChannelSettings(
            d2c=resolved_channels.get("d2c", []),
            marketplaces=resolved_channels.get("marketplaces", []),
            qcom=resolved_channels.get("qcom", []),
            others=final_channel_others
        ),
        stack=StackSettings(
            orders=resolved_stack.get("orders", []),
            payments=resolved_stack.get("payments", []),
            shipping=resolved_stack.get("shipping", []),
            payouts=resolved_stack.get("payouts", []),
            marketing=resolved_stack.get("marketing", []),
            analytics=resolved_stack.get("analytics", []),
            finance=resolved_stack.get("finance", []),
            others=final_stack_others
        )
    )
