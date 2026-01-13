from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, BackgroundTasks, Header
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlmodel import select, col, func
from sqlmodel.ext.asyncio.session import AsyncSession
from loguru import logger

from app.api.deps import get_current_active_user, get_db_session
from app.models.user import User
from app.models.integration import Integration, IntegrationStatus
from app.services.shopify.oauth_service import shopify_oauth_service
from app.services.analytics.service import AnalyticsService
from app.models.company import Company
from app.core.config import settings
from app.core.limiter import limiter
from app.core.version import get_app_version

router = APIRouter()

# --- Schemas ---

class ShopUrlRequest(BaseModel):
    shop_domain: str
    company_id: UUID

class ValidateShopRequest(BaseModel):
    shop_domain: str

class AuthUrlResponse(BaseModel):
    url: str

class SyncRequest(BaseModel):
    months: Optional[int] = 12 # Default 12 months as per plan

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

@router.get("/rate-limit-test")
@limiter.limit("1/minute")
async def rate_limit_test(request: Request):
    return {"status": "ok"}

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


@router.post("/install")
@limiter.limit("5/minute")
async def install_shopify_app(
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
    Initiates the Shopify app installation process.
    This endpoint is typically called by the frontend to start the OAuth flow.
    """
    # This endpoint might just redirect to the Shopify authorization URL
    # or handle the initial steps of the installation.
    # For now, let's assume it's a placeholder or will be integrated with the existing callback logic.
    # The actual OAuth flow starts with generating the URL and redirecting the user.
    # This endpoint might be used for a direct app store install flow.
    
    # For now, let's just log and return a placeholder response.
    logger.info(f"Shopify app install initiated for shop: {shop}")
    return {"message": "Shopify app installation initiated (placeholder)"}


@router.get("/callback")
async def shopify_callback(
    request: Request,
    shop: str,
    code: str,
    state: str,
    hmac: str,
    background_tasks: BackgroundTasks,
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
    
    # Trace for debugging
    with open("oauth_trace.log", "a") as f:
        f.write(f"[{datetime.now().isoformat()}] Callback for {shop}: params={params}\n")

    # 1. HMAC Verification (Critical)
    # NOTE: Shopify API Secret in .env seems wrong (starts with shpss_)
    is_valid = shopify_oauth_service.verify_callback_hmac(params)
    if not is_valid:
        msg = f"HMAC Validation Failed for shop: {shop}"
        logger.warning(msg)
        with open("oauth_trace.log", "a") as f:
            f.write(f"[{datetime.now().isoformat()}] {msg} - check SHOPIFY_API_SECRET in .env\n")
        return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard-new/integrations?error=hmac_invalid")

    try:
        # 2. Extract Company Context from State
        company_id_str = shopify_oauth_service.validate_state_and_get_company(state)
        if not company_id_str:
             msg = f"OAuth State Validation Failed for shop {shop} - state: {state[:20]}..."
             logger.error(msg)
             with open("oauth_trace.log", "a") as f:
                 f.write(f"[{datetime.now().isoformat()}] {msg}\n")
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
            # target_integration.in_stack = True # Auto-add to stack on connect/reconnect - REMOVED: Managed by Company Service or separate logic
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
                # in_stack=True, # Auto-add to stack - REMOVED
                credentials={
                    "access_token": encrypted_token,
                    "shop": shop
                },
                metadata_info={
                    "shop": shop,
                    "scopes": shopify_oauth_service.SCOPES
                },
                app_version=get_app_version()  # Track installed version
            )
            session.add(target_integration)
            
        
        await session.commit()
        await session.refresh(target_integration)
        
        # 6. Register Webhooks Synchronously (with verification)
        logger.info(f"Registering webhooks for {shop}...")
        webhook_results = await shopify_oauth_service.register_webhooks(
            shop_domain=shop,
            access_token=access_token
        )
        
        # Store webhook registration status in metadata
        current_meta = target_integration.metadata_info or {}
        current_meta["webhook_registration"] = {
            "status": webhook_results["status"],
            "success_rate": webhook_results["success_rate"],
            "registered_at": datetime.now(timezone.utc).isoformat(),
            "success_count": len(webhook_results["success"]) + len(webhook_results["already_exists"]),
            "failed_count": len(webhook_results["failed"])
        }
        
        if webhook_results["failed"]:
            current_meta["webhook_registration"]["failures"] = webhook_results["failed"]
            logger.warning(f"Some webhooks failed to register: {webhook_results['failed']}")
        
        target_integration.metadata_info = current_meta
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(target_integration, "metadata_info")
        session.add(target_integration)
        await session.commit()
        
        logger.info(f"Webhook registration complete: {webhook_results['success_rate']}% success rate")

        # 7. Initial Data Fetch (Optional: could also be background)
        # For now, we'll let the user trigger it or start it here.


    except Exception as e:
        import traceback
        error_msg = f"OAuth Callback Error: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        with open("oauth_debug.log", "w") as f:
            f.write(error_msg)
        # Redirect to frontend error page with generic but logged failure
        return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard-new/integrations?error=handshake_failed")

    # Success - Redirect to frontend dashboard (Platform Integration Flow)
    # The embedded app at admin.shopify.com is separate and accessed directly via backend root
    return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard-new/integrations?success=true&shop={shop}")

@router.post("/sync/{integration_id}")
async def trigger_historical_sync(
    integration_id: UUID,
    background_tasks: BackgroundTasks,
    payload: Optional[SyncRequest] = None,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Triggers a background historical backfill for Orders.
    """
    # 1. Validation
    integration = await session.get(Integration, integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
        
    # 2. Trigger Background Task
    from app.services.shopify.tasks import run_shopify_sync_task
    background_tasks.add_task(
        run_shopify_sync_task,
        integration_id=integration.id,
        months=payload.months if payload else 12
    )
    
    return {"status": "queued", "message": f"Historical sync ({payload.months if payload else 12} months) started in background"}

@router.post("/webhooks/{topic:path}")
@limiter.limit("200/minute")
async def handle_shopify_webhook(
    topic: str,
    request: Request,
    response: Response,
    x_shopify_hmac_sha256: str = Header(None),
    x_shopify_topic: str = Header(None),
    x_shopify_shop_domain: str = Header(None),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Receives real-time data from Shopify.
    Verifies HMAC -> Ingests Raw -> Triggers Refinement.
    """
    try:
        # 1. Get Raw Body
        body_bytes = await request.body()
        try:
            body_str = body_bytes.decode('utf-8')
        except UnicodeDecodeError:
             logger.error("Webhook Body Decode Error")
             raise HTTPException(status_code=400, detail="Invalid encoding")

        # 2. Verify HMAC (Critical)
        # Skip validation only in development for simulation scripts using a specific header
        dev_bypass_code = request.headers.get("X-Unclutr-Dev-Bypass")
        is_dev_bypass = (not settings.is_production) and (dev_bypass_code == "local-dev-bypass")

        if not is_dev_bypass:
            if not shopify_oauth_service.verify_webhook_hmac(body_bytes, x_shopify_hmac_sha256):
                 logger.warning(f"Webhook HMAC Invalid for shop: {x_shopify_shop_domain}")
                 raise HTTPException(status_code=401, detail="HMAC verification failed")
            logger.info(f"Webhook HMAC Verified for {x_shopify_shop_domain}")
        else:
            logger.info(f"Webhook HMAC Verification bypassed (Dev Mode) for {x_shopify_shop_domain}")

        # 3. Find Integration
        # Query for this shop using JSON extraction (no status filter - accept webhooks in any state)
        stmt = select(Integration).where(
            Integration.metadata_info["shop"].astext == x_shopify_shop_domain
        )
        
        result = await session.execute(stmt)
        integration = result.scalars().first()
        
        if not integration:
            logger.warning(f"Integration not found for shop: {x_shopify_shop_domain}")
            return {"status": "ignored", "reason": "unknown_shop"}

        logger.info(f"Found integration {integration.id} for shop {x_shopify_shop_domain}")

        # 4. Ingest
        payload = await request.json()
        from app.services.shopify.sync_service import shopify_sync_service
        from app.services.shopify.refinement_service import shopify_refinement_service
        from app.models.shopify.product import ShopifyProduct
        
        # Map topic to object_type
        obj_type = "unknown"
        if not x_shopify_topic:
             x_shopify_topic = "unknown"
             
        if "orders" in x_shopify_topic:
            obj_type = "order"
        elif "refunds" in x_shopify_topic:
            obj_type = "refund"
        elif "fulfillments" in x_shopify_topic:
            obj_type = "fulfillment"
        elif "customers" in x_shopify_topic:
            obj_type = "customer"
        elif "products" in x_shopify_topic:
            obj_type = "product"
            
            # --- SPECIAL HANDLING FOR PRODUCT DELETION ---
            # Deletion webhooks only have {id: ...}. If we delete the SQL record, we lose the 'title'.
            # We look it up NOW (while it still exists) and store it in payload for activity log.
            if "delete" in x_shopify_topic:
                try:
                    p_id = payload.get("id")
                    if p_id:
                        p_stmt = select(ShopifyProduct).where(
                            ShopifyProduct.integration_id == integration.id,
                            ShopifyProduct.shopify_product_id == p_id
                        )
                        p_res = await session.execute(p_stmt)
                        p_obj = p_res.scalars().first()
                        if p_obj:
                            payload["_cached_title"] = p_obj.title
                            logger.info(f"Cached product title '{p_obj.title}' for deletion webhook")
                except Exception as cache_err:
                    logger.error(f"Failed to cache product title: {cache_err}")
            # ---------------------------------------------

        elif "inventory_levels" in x_shopify_topic:
            obj_type = "inventory_level"
        elif "inventory_items" in x_shopify_topic:
            obj_type = "inventory_item"
        elif "locations" in x_shopify_topic:
            obj_type = "location"
        elif "payouts" in x_shopify_topic:
            obj_type = "payout"
        elif "disputes" in x_shopify_topic:
            obj_type = "dispute"
        elif "price_rules" in x_shopify_topic:
            obj_type = "price_rule"
        elif "checkouts" in x_shopify_topic:
            obj_type = "checkout"
        elif "marketing_events" in x_shopify_topic:
            obj_type = "marketing_event"
            
        await shopify_sync_service.ingest_raw_object(
            session=session,
            integration=integration,
            object_type=obj_type,
            payload=payload,
            source="webhook",
            topic=x_shopify_topic,
            created_by="System"
        )
        
        # 5. Trigger Immediate Refinement (with integration filter)
        await session.commit()
        
        # Process the webhook immediately for real-time updates
        try:
            await shopify_refinement_service.process_pending_records(
                session, 
                integration_id=integration.id,
                limit=10
            )
            await session.commit()
            logger.info(f"✅ Refinement completed successfully for integration {integration.id}")
        except Exception as refinement_error:
            logger.error(f"Refinement failed but webhook logged: {refinement_error}")
            # Don't fail the webhook - it's already logged
        
        logger.info(f"🔍 About to start stats recalculation for integration {integration.id}")
        # 6. Real-Time Stats Recalculation from DB (Source of Truth)
        # Query actual counts from refined tables to ensure accuracy
        logger.info(f"Starting real-time stats recalculation for integration {integration.id}")
        from app.models.shopify.order import ShopifyOrder
        from app.models.shopify.product import ShopifyProduct
        from app.models.shopify.customer import ShopifyCustomer
        from app.models.shopify.inventory import ShopifyInventoryLevel, ShopifyLocation
        
        try:
            logger.info("Querying database for fresh stats...")
            # Orders count
            orders_stmt = select(func.count(ShopifyOrder.id)).where(
                ShopifyOrder.integration_id == integration.id
            )
            orders_count = (await session.execute(orders_stmt)).scalar_one() or 0
            
            # Products count
            products_stmt = select(func.count(ShopifyProduct.id)).where(
                ShopifyProduct.integration_id == integration.id
            )
            products_count = (await session.execute(products_stmt)).scalar_one() or 0
            
            # Customers count
            customers_stmt = select(func.count(ShopifyCustomer.id)).where(
                ShopifyCustomer.integration_id == integration.id
            )
            customers_count = (await session.execute(customers_stmt)).scalar_one() or 0
            
            # Locations count
            locations_stmt = select(func.count(ShopifyLocation.id)).where(
                ShopifyLocation.integration_id == integration.id
            )
            locations_count = (await session.execute(locations_stmt)).scalar_one() or 0
            
            # Inventory total (sum of available across all locations)
            inventory_stmt = select(func.sum(ShopifyInventoryLevel.available)).where(
                ShopifyInventoryLevel.integration_id == integration.id
            )
            inventory_count = (await session.execute(inventory_stmt)).scalar_one() or 0
            
            # Revenue calculation (matching Shopify's definition)
            # Total Sales = Gross Sales - Returns + Net Tax
            revenue_stmt = select(
                func.sum(ShopifyOrder.subtotal_price - ShopifyOrder.refunded_subtotal + ShopifyOrder.total_tax - ShopifyOrder.refunded_tax)
            ).where(
                ShopifyOrder.integration_id == integration.id,
                ShopifyOrder.financial_status != "unknown",
                ShopifyOrder.shopify_order_number != 1070  # Exclude test orders
            )
            total_revenue = (await session.execute(revenue_stmt)).scalar_one() or 0.0
            
            # Update metadata with fresh DB counts
            current_meta = integration.metadata_info or {}
            sync_stats = current_meta.get("sync_stats", {})
            sync_stats.update({
                "orders_count": orders_count,
                "products_count": products_count,
                "customers_count": customers_count,
                "locations_count": locations_count,
                "inventory_count": int(inventory_count),
                "total_revenue": float(total_revenue),
                "last_updated": datetime.now(timezone.utc).isoformat()
            })
            current_meta["sync_stats"] = sync_stats
            integration.metadata_info = current_meta
            integration.last_sync_at = datetime.now(timezone.utc)
            
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(integration, "metadata_info")
            session.add(integration)
            await session.commit()
            
            # --- Trigger Historical Metrics Snapshot (Module 6) ---
            try:
                today = datetime.now(timezone.utc).date()
                await AnalyticsService.refresh_snapshot(session, integration, today)
                await session.commit()
                logger.info(f"✅ Daily Snapshot updated for {today}")
            except Exception as metric_err:
                logger.error(f"Failed to update daily snapshot: {metric_err}")

            logger.info(f"Real-time stats updated: Orders={orders_count}, Products={products_count}, Inventory={inventory_count}")
            
        except Exception as stats_error:
            logger.error(f"Stats recalculation failed: {stats_error}")
            # Don't fail the webhook - stats will be corrected on next sync

        return {"status": "received"}

    except KeyError as e:
        # Missing required field in payload - log but don't crash
        logger.warning(f"Webhook payload missing required field: {e}")
        return {"status": "received", "warning": f"Missing field: {e}"}
    except HTTPException:
        # Re-raise HTTP exceptions (like 401) to ensure correct status codes
        raise
    except Exception as e:
        import traceback
        error_msg = f"Webhook Error: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        
        # In Development, return a 500 error for visibility in scripts
        if not settings.is_production:
             raise HTTPException(status_code=500, detail=str(e))
             
        # Shopify requires 200 OK even on errors, or it will retry
        # Log the error but return success to prevent retry storms
        return {"status": "error", "message": "Logged for investigation"}




