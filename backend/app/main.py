import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, WebSocket

from app.core.config import settings

# OAuth Insecure Transport for Development (Required for ngrok HTTP -> HTTPS)
if not settings.is_production:
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    # logger.info("OAuth: OAUTHLIB_INSECURE_TRANSPORT set to 1 for development")
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from sqlmodel import select

from app.core.db import get_session, init_db
from app.core.version import APP_VERSION
from app.models.company import Company
from app.services.shopify.oauth_service import shopify_oauth_service

# Force reload to clear SQLAlchemy metadata cache


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await init_db()
        logger.info("Startup: Database initialized successfully.")
        
        # [DEBUG] Log all registered routes to verify WebSocket mount
        routes = [route.path for route in app.routes]
        logger.info(f"Startup: Registered Routes: {routes}")
    except Exception as e:
        logger.error(f"Startup: Database initialization failed! App continuing in degraded mode. Error: {e}")
    
    # Start Background Reconciliation (Layer 3 - Scheduler)
    try:
        from app.services.scheduler import shutdown_scheduler, start_scheduler
        start_scheduler()
        logger.info("Startup: Scheduler started successfully.")
    except Exception as e:
        logger.error(f"Startup: Scheduler failed to start! Error: {e}")
    
    yield
    # Shutdown
    try:
        shutdown_scheduler()
    except Exception:
        pass

async def run_reconciliation_worker():
    """
    Background worker that runs every 6 hours to reconcile all active integrations.
    """
    from sqlmodel import select

    from app.core.db import get_session
    from app.models.integration import Integration, IntegrationStatus
    from app.services.shopify.tasks import run_shopify_sync_task
    
    logger.info("Reconciliation worker started.")
    
    while True:
        try:
            # Wait 6 hours between runs (or 10 mins for initial testing if needed? 
            # In production, 6 hours is set in the plan)
            # For this session, let's stick to 6 hours or 3600*6
            await asyncio.sleep(3600 * 6) 
            
            logger.info("Triggering scheduled reconciliation for all active integrations...")
            
            session_gen = get_session()
            session = await session_gen.__anext__()
            
            stmt = select(Integration).where(Integration.status == IntegrationStatus.ACTIVE)
            result = await session.execute(stmt)
            active_integrations = result.scalars().all()
            
            for integration in active_integrations:
                # Trigger delta sync in background
                # Note: We don't await the task itself here to allow parallel processing across integrations
                # and to not block the sleeper.
                asyncio.create_task(run_shopify_sync_task(integration.id, delta=True))
                logger.info(f"Scheduled delta sync for integration {integration.id}")
            
            await session.close()
            
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Reconciliation worker loop error: {e}")
            await asyncio.sleep(60) # Fail-safe sleep

app = FastAPI(
    title="SquareUp API",
    description="""
Backend for SquareUp - The Decision & Control Layer for D2C.

### 🔐 Authorization
To test protected endpoints, click the **Authorize** button:

1. **Development Login**: Use any username and password `admin`.
2. **Email/Password**: Use your real Firebase credentials. (Requires `FIREBASE_API_KEY` in `.env`)
3. **Google Auth**: 
   - Login on the [Frontend](http://localhost:3000).
   - Open DevTools (F12) -> Application -> Local Storage.
   - Look for `firebase:authUser:...`.
   - Copy the `stsTokenManager.accessToken`.
   - Paste it directly into the **Bearer** field in Swagger (click Authorize -> JWT (Bearer)).
""",
    version=APP_VERSION,
    lifespan=lifespan
)


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    # Log all query parameters for debugging
    params = dict(request.query_params)
    if params:
        logger.info(f"Root accessed with params: {list(params.keys())}")
    
    # Check if this is a Shopify Installation Handshake
    # Install requests have: shop, hmac, timestamp, and sometimes host
    shop = params.get("shop")
    hmac_val = params.get("hmac")
    timestamp = params.get("timestamp")
    embedded = params.get("embedded")
    
    # Only trigger OAuth if this is an install request (has shop, hmac, AND timestamp)
    # Skip if embedded=1 (coming from OAuth callback redirect)
    # Regular app loads from Shopify admin may have shop but not hmac/timestamp
    if shop and hmac_val and timestamp and not embedded:
        # Verify HMAC (Security)
        if shopify_oauth_service.verify_callback_hmac(params):
            logger.info(f"Root: Detected valid Shopify install request for {shop}")
            
            # Auto-Select Company for Dev Flow (Simplification)
            if not settings.is_production:
                session_gen = get_session()
                session = await session_gen.__anext__()
                try:
                    stmt = select(Company)
                    result = await session.execute(stmt)
                    company = result.scalars().first()
                    
                    if company:
                        logger.info(f"Dev Mode: Auto-selecting company {company.id} for install")
                        auth_url = await shopify_oauth_service.generate_authorization_url(
                            shop_domain=shop,
                            company_id=company.id
                        )
                        # Use JS redirect to break out of iframe with loading UI
                        return HTMLResponse(f"""
                        <html>
                            <head>
                                <title>Redirecting to Shopify...</title>
                                <style>
                                    body {{ font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9fafb; }}
                                    .container {{ text-align: center; }}
                                    .spinner {{ border: 3px solid #f3f3f3; border-top: 3px solid #065f46; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }}
                                    @keyframes spin {{ 0% {{ transform: rotate(0deg); }} 100% {{ transform: rotate(360deg); }} }}
                                    p {{ color: #6b7280; }}
                                    a {{ color: #065f46; text-decoration: underline; }}
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="spinner"></div>
                                    <p>Redirecting to Shopify authorization...</p>
                                    <p><a href="{auth_url}" onclick="window.top.location.href=this.href; return false;">Click here if not redirected automatically</a></p>
                                </div>
                                <script>
                                    // Immediate redirect
                                    window.top.location.href = '{auth_url}';
                                </script>
                            </body>
                        </html>
                        """)
                    else:
                        logger.warning("Dev Mode: No company found in DB to attach integration to.")
                finally:
                    await session.close()
        else:
            logger.warning(f"Root: HMAC verification failed for {shop}")

    # Get last installed date/time from database if shop parameter is present
    last_installed = None
    if shop:
        session_gen = get_session()
        session = await session_gen.__anext__()
        try:

            from app.models.integration import Integration
            # Query all integrations and filter in Python
            stmt = select(Integration).order_by(Integration.updated_at.desc())
            result = await session.execute(stmt)
            integrations = result.scalars().all()
            # Find integration matching the shop
            for integration in integrations:
                if integration.credentials and integration.credentials.get("shop") == shop:
                    if integration.updated_at:
                        # Convert to IST (UTC+5:30) and format as human-readable date/time
                        from datetime import timedelta
                        from datetime import timezone as tz
                        ist = tz(timedelta(hours=5, minutes=30))
                        ist_time = integration.updated_at.astimezone(ist)
                        last_installed = ist_time.strftime("%b %d, %Y at %I:%M %p IST")
                    break
        except Exception as e:
            logger.error(f"Error querying integration timestamp: {e}")
        finally:
            await session.close()
    
    # Fallback message if no installation found
    display_info = last_installed or "Not yet installed"
    
    return f"""
    <html>
        <head>
            <title>SquareUp - Shopify App</title>
            <style>
                body {{ font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }}
                .container {{ text-align: center; padding: 3rem; background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); max-width: 500px; }}
                h1 {{ color: #111827; margin-bottom: 0.5rem; font-size: 2rem; }}
                .version {{ display: inline-block; padding: 0.5rem 1rem; background: #f3f4f6; color: #374151; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; margin: 1rem 0; }}
                .status {{ display: inline-block; padding: 0.5rem 1rem; background: #d1fae5; color: #065f46; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; margin-top: 1rem; }}
                p {{ color: #6b7280; line-height: 1.6; }}
                .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem; text-align: left; }}
                .info-item {{ padding: 1rem; background: #f9fafb; border-radius: 8px; }}
                .info-label {{ font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }}
                .info-value {{ font-size: 1.125rem; color: #111827; font-weight: 600; margin-top: 0.25rem; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎯 SquareUp</h1>
                <p>Shopify Integration Active</p>
                <div class="version">Last Installed: {display_info}</div>
                <div class="status">● Connected</div>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Status</div>
                        <div class="info-value">Installed</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Environment</div>
                        <div class="info-value">{'Production' if settings.is_production else 'Development'}</div>
                    </div>
                </div>
                
                <p style="margin-top: 2rem; font-size: 0.875rem;">
                    This app is successfully connected to your Shopify store.
                </p>
            </div>
        </body>
    </html>
    """

import logging

from app.api.v1.api import api_router
from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Rate Limiting
import traceback

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.limiter import limiter

if settings.RATE_LIMIT_ENABLED:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    logger.info(f"Rate limiting enabled: {settings.RATE_LIMIT_PER_MINUTE} requests/minute")
else:
    limiter.enabled = False
    logger.warning("Rate limiting is DISABLED")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler to ensure all errors return a JSON response.
    This is CRITICAL for CORS, as generic server crashes often omit CORS headers,
    leading to confusing 'CORS policy' errors in the browser.
    """
    logger.error(f"🔥 Global Exception caught in {request.method} {request.url.path}: {str(exc)}")
    logger.error(traceback.format_exc())
    
    try:
        with open("debug_sync_error.log", "a") as f:
            f.write(f"\n--- Global Error {request.url.path} ---\n")
            f.write(traceback.format_exc())
    except Exception:
        pass

    # In development, return the actual error. In production, be generic.
    error_detail = str(exc) if not settings.is_production else "An unexpected internal error occurred."
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": error_detail,
            "type": exc.__class__.__name__,
            "path": request.url.path
        }
    )

# CORS Configuration
# Base origins for exact matching
base_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://almost.joinsquareup.com",
]

# Development: Broaden CORS
# This regex covers http://localhost, http://127.0.0.1 on any port,
# and any ngrok-free.dev or ngrok.io subdomain.
allow_origin_regex = None
if not settings.is_production:
    # Regex to match:
    # 1. http://localhost:* or http://127.0.0.1:*
    # 2. https://*.ngrok-free.dev or https://*.ngrok.io
    # 3. https://unwastable-godsent-see.ngrok-free.dev (specific one just in case)
    allow_origin_regex = r"https?://((localhost|127\.0\.0\.1)(:\d+)?|.*\.ngrok-free\.dev|.*\.ngrok\.io)"
    logger.info(f"CORS: Enabled broad development regex: {allow_origin_regex}")

# Merge with settings origins
if settings.is_production:
    origins = settings.allowed_origins_list
else:
    # Explicitly include both localhost and 127.0.0.1 for both 3000 and 8000
    origins = list(set(base_origins + settings.allowed_origins_list + [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]))

logger.info(f"CORS origins (static): {origins}")


# (Moved CORSMiddleware to end to ensure it runs first)

# Sentry & Logging Middleware
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

from app.core.logging_middleware import RequestLoggingMiddleware

if settings.SENTRY_DSN and settings.is_production:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,  # Don't send PII
    )
    logger.info(f"Sentry initialized for environment: {settings.ENVIRONMENT}")
else:
    logger.warning("Sentry disabled (not production) or DSN not configured")



from app.middleware.tenant_middleware import TenantMiddleware

# if settings.is_production:
#     app.add_middleware(HTTPSRedirectMiddleware)
#     logger.info("HTTPS Enforcement Enabled")

app.add_middleware(TenantMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# CORSMiddleware must be added LAST to be the OUTERMOST layer (runs first)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Shopify Sub-App (Separate Documentation Page)
from app.api.v1.endpoints.shopify.app import shopify_app

# Mount at /api/v1/integrations/shopify
# This preserves the paths while providing a separate /docs at this URL
app.mount(f"{settings.API_V1_STR}/integrations/shopify", shopify_app)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "SquareUp Backend", "version": APP_VERSION}

# [FIX] Manually register WebSocket route to ensure it exists
# 'include_router' with prefix sometimes fails to register WS routes correctly in this setup
from app.api.v1.endpoints.execution import campaign_websocket
app.add_api_websocket_route(f"{settings.API_V1_STR}/execution/campaign/{{campaign_id}}/ws", campaign_websocket)



