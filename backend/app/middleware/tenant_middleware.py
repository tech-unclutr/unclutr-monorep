import logging
import uuid

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from sqlmodel import select
from starlette.types import ASGIApp, Receive, Scope, Send

from app.core.context import set_company_ctx, set_user_ctx, set_workspace_ctx
from app.core.db import async_session_factory
from app.core.security import get_current_user_no_depends
from app.models.iam import CompanyMembership

logger = logging.getLogger(__name__)

class TenantMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] not in ("http", "websocket"):
            await self.app(scope, receive, send)
            return

        # 1. IMMEDIATE WEBSOCKET BYPASS
        # Critical Fix for 1006 Disconnects: 
        # BaseHTTPMiddleware interferes with WebSocket upgrades.
        # We explicitly pass through any WebSocket connection immediately.
        # Auth for WebSockets is handled by the endpoint itself (via Query Param).
        if scope["type"] == "websocket":
            await self.app(scope, receive, send)
            return

        # ------------------------------------------------------------------
        # HTTP Request Handling
        # ------------------------------------------------------------------
        
        # Use Starlette/FastAPI Request object for convenience
        request = Request(scope, receive=receive)
        
        # Helper to send JSON response directly
        async def send_response(response: Response):
            await response(scope, receive, send)

        path = request.url.path
        
        # Log path for debugging
        if "/api/v1/companies" in path:
             # logger.info(f"TenantMiddleware: Processing path: {path}")
             pass
             
        if request.method == "OPTIONS":
            await self.app(scope, receive, send)
            return

        # 1. Extract and Verify Auth
        auth_header = request.headers.get("Authorization")
        user_id = None
        
        if auth_header:
            try:
                decoded_token = await get_current_user_no_depends(auth_header)
                user_id = decoded_token.get("uid")
                set_user_ctx(user_id)
                request.state.user_id = user_id
                request.state.token_payload = decoded_token
            except Exception:
                pass

        # 2. Bypass check for public endpoints 
        # Note: WebSocket check removed here as it's handled above
        
        public_paths = [
            "/health", "/docs", "/openapi.json", 
            "/auth/login", "/auth/sync", 
            "/onboarding", "/datasources", 
            "/company/me", "/users",
            "/dev/", "/companies",
            "/integrations/shopify/callback",
            "/integrations/shopify/install",
            "/integrations/shopify/rate-limit-test",
            "/integrations/shopify/validate-shop",
            "/integrations/shopify/auth/url",
            "/intelligence/calendar/google/callback",
            "/intelligence/interview/bolna-webhook",
            "/webhook/bolna"
        ]
        
        # Check if path starts with any public path OR contains /webhooks/ OR is exactly / OR ends with /ws
        # [CRITICAL RESTORATION] We must keep path-based bypass for WebSockets here because 
        # in some environments (Cloud Run + H2), the ASGI scope type might stay 'http' 
        # due to stripped Upgrade headers, bypassing the scope['type'] == 'websocket' check above.
        is_public = path == "/" or any(p in path for p in public_paths) or "/webhooks/" in path or path.endswith("/ws")
        
        if is_public:
            await self.app(scope, receive, send)
            return

        # 3. Validation
        if not auth_header:
             await send_response(JSONResponse(content={"detail": "Unauthorized: Missing Auth Header"}, status_code=401))
             return

        company_id_str = request.headers.get("X-Company-ID")
        workspace_id_str = request.headers.get("X-Workspace-ID")

        if not company_id_str:
            logger.warning(f"TenantMiddleware: Missing X-Company-ID header for path {path} from user {user_id}")
            await send_response(JSONResponse(content={"detail": "Forbidden: Missing X-Company-ID"}, status_code=403))
            return

        try:
            company_id = uuid.UUID(company_id_str)
            set_company_ctx(company_id)
            request.state.company_id = company_id
            
            if workspace_id_str:
                workspace_id = uuid.UUID(workspace_id_str)
                set_workspace_ctx(workspace_id)
                request.state.workspace_id = workspace_id
            else:
                request.state.workspace_id = None
                
        except ValueError:
            logger.error(f"TenantMiddleware: Invalid UUID format in X-Company-ID header: {company_id_str} (Path: {path}, User: {user_id})")
            await send_response(JSONResponse(content={"detail": f"Bad Request: Invalid UUID format in headers ({company_id_str})"}, status_code=400))
            return

        # 4. Membership Check
        if not user_id:
             await send_response(JSONResponse(content={"detail": "Unauthorized: Invalid Token (No User ID)"}, status_code=401))
             return

        try:
            async with async_session_factory() as session:
                stmt = select(CompanyMembership).where(
                    CompanyMembership.company_id == company_id,
                    CompanyMembership.user_id == user_id
                )
                result = await session.execute(stmt)
                membership = result.scalars().first()
                
                if membership:
                    request.state.role = membership.role
                else:
                    # Final attempt: RAW SQL to bypass potential ORM/Session synchronization issues
                    try:
                        from sqlalchemy import text
                        raw_stmt = text("SELECT role FROM company_membership WHERE company_id = :cid AND user_id = :uid")
                        raw_result = await session.execute(raw_stmt, {"cid": company_id, "uid": user_id})
                        raw_membership = raw_result.first()
                        
                        if raw_membership:
                            logger.warning(f"TenantMiddleware: SQLAlchemy lookup failed but Raw SQL found membership for {user_id}. Self-healing active.")
                            request.state.role = raw_membership.role
                        else:
                            await send_response(JSONResponse(content={"detail": f"Forbidden: User {user_id} is not a member of Company {company_id}"}, status_code=403))
                            return
                    except Exception as raw_e:
                        logger.error(f"TenantMiddleware: Raw SQL fallback failed: {raw_e}")
                        await send_response(JSONResponse(content={"detail": f"Forbidden: User {user_id} is not a member of Company {company_id}"}, status_code=403))
                        return
        except Exception as e:
            import traceback
            logger.error(f"TenantMiddleware Error: {str(e)}\n{traceback.format_exc()}")
            await send_response(JSONResponse(
                content={"detail": f"Internal Server Error in Tenant Verification: {str(e)}"}, 
                status_code=500
            ))
            return
            
        await self.app(scope, receive, send)
