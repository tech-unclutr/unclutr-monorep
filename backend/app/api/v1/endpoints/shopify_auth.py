from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from loguru import logger

from app.api.deps import get_current_active_user, get_db_session
from app.models.user import User
from app.models.integration import Integration, IntegrationStatus
from app.services.shopify.oauth_service import shopify_oauth_service
from app.models.company import Company
from app.core.config import settings

router = APIRouter()

# --- Schemas ---

class ShopUrlRequest(BaseModel):
    shop_domain: str
    company_id: UUID

class ValidateShopRequest(BaseModel):
    shop_domain: str

class AuthUrlResponse(BaseModel):
    url: str

# --- Endpoints ---

@router.post("/validate-shop", response_model=bool)
async def validate_shop(
    payload: ValidateShopRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    Checks if a shop domain is reachable and valid format.
    """
    return await shopify_oauth_service.validate_shop_domain(payload.shop_domain)

@router.post("/auth/url", response_model=AuthUrlResponse)
async def get_auth_url(
    payload: ShopUrlRequest,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Generates the Shopify OAuth redirection URL for the frontend to redirect to.
    """
    # Security: Ensure user belongs to the company they are requesting for
    # (Assuming basic relationship check logic exists or User is tied to Company context)
    # For now, simplistic check:
    # if current_user.company_id != payload.company_id: raise 403...
    
    url = await shopify_oauth_service.generate_authorization_url(
        shop_domain=payload.shop_domain,
        company_id=payload.company_id
    )
    return AuthUrlResponse(url=url)


@router.get("/callback")
async def shopify_callback(
    request: Request,
    shop: str,
    code: str,
    state: str,
    hmac: str,
    host: Optional[str] = None,
    timestamp: Optional[str] = None,
    session: AsyncSession = Depends(get_db_session)
):
    """
    The Callback URL where Shopify redirects after user approval.
    1. Verify HMAC
    2. Exchange Code for Access Token
    3. Encrypt Token with Fernet
    4. Create/Update Integration Record
    5. Redirect back to Frontend
    """
    params = dict(request.query_params)
    
    # 1. HMAC Verification (Critical)
    is_valid = shopify_oauth_service.verify_callback_hmac(params)
    if not is_valid:
        logger.warning(f"HMAC Validation Failed for shop: {shop}")
        return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard-new/integrations?error=hmac_invalid")

    try:
        # 2. Extract Company Context from State
        company_id_str = shopify_oauth_service.validate_state_and_get_company(state)
        if not company_id_str:
             logger.error("OAuth State Validation Failed - potential CSRF or tampering")
             return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard-new/integrations?error=state_invalid")
            
        company_id = UUID(company_id_str)

        # 3. Exchange Code
        access_token = await shopify_oauth_service.exchange_code_for_token(shop, code)
        
        # 4. Encrypt Token
        encrypted_token = shopify_oauth_service.encrypt_token(access_token)
        
        # 5. Upsert Integration Record
        # Check if exists
        # 5. Upsert Integration Record
        # We need the 'Data Source' ID for Shopify. 

        # Better: Query Integration where metadata_info->>'shop' = shop AND company_id = company_id
        
        # ACTUALLY: Let's simpler logic.
        # We need the 'Data Source' ID for Shopify. 
        # For this MVP step, let's assume valid UUID or find it by name 'Shopify'
        from app.models.datasource import DataSource
        ds_stmt = select(DataSource).where(DataSource.name == "Shopify")
        ds_result = await session.execute(ds_stmt)
        shopify_ds = ds_result.scalars().first()
        
        if not shopify_ds:
             raise HTTPException(status_code=500, detail="Shopify DataSource definition missing")

        # Find existing integration for this specific shop
        # (Handling multi-store case by checking 'shop' in metadata)
        int_stmt = select(Integration).where(
            Integration.company_id == company_id,
            Integration.datasource_id == shopify_ds.id
        )
        int_result = await session.execute(int_stmt)
        existing_integrations = int_result.scalars().all()
        
        target_integration = None
        # 1. Try exact match
        for integ in existing_integrations:
             if integ.metadata_info.get("shop") == shop:
                 target_integration = integ
                 break
        
        # 2. Fallback: Try any INACTIVE integration (claiming a placeholder)
        if not target_integration:
            for integ in existing_integrations:
                if integ.status == IntegrationStatus.INACTIVE:
                    logger.info(f"Claiming inactive integration {integ.id} for shop {shop}")
                    target_integration = integ
                    break
        
        if target_integration:
            # Update existing
            target_integration.status = IntegrationStatus.ACTIVE
            target_integration.credentials = {
                "access_token": encrypted_token,
                "shop": shop
            }
            # Ensure metadata is updated even when claiming an inactive placeholder
            target_integration.metadata_info = {
                "shop": shop,
                "scopes": shopify_oauth_service.SCOPES
            }
            target_integration.updated_at = datetime.utcnow()
            session.add(target_integration)
        else:
            # Create new
            # We need a workspace_id. For V1, pick the first workspace of the company?
            # Or pass workspace_id in state too?
            # For now, default to company's primary workspace if logic exists, or NULL?
            # Integration model requires workspace_id.
            # Let's query one.
            from app.models.company import Workspace
            ws_stmt = select(Workspace).where(Workspace.company_id == company_id)
            ws_res = await session.execute(ws_stmt)
            workspace = ws_res.scalars().first()
            
            if not workspace:
                 raise HTTPException(status_code=500, detail="No workspace found for company")

            target_integration = Integration(
                company_id=company_id,
                workspace_id=workspace.id,
                datasource_id=shopify_ds.id,
                status=IntegrationStatus.ACTIVE,
                credentials={
                    "access_token": encrypted_token,
                    "shop": shop
                },
                metadata_info={
                    "shop": shop,
                    "scopes": shopify_oauth_service.SCOPES
                }
            )
            session.add(target_integration)
            
        await session.commit()

    except Exception as e:
        import traceback
        error_msg = f"OAuth Callback Error: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        with open("oauth_debug.log", "w") as f:
            f.write(error_msg)
        # Redirect to frontend error page with generic but logged failure
        return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard-new/integrations?error=handshake_failed")

    # Success Redirect
    return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard-new/integrations?success=true&shop={shop}")
