from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
import uuid
from app.core.security import get_current_user_no_depends
from app.core.context import set_company_ctx, set_workspace_ctx, set_user_ctx
from sqlmodel import select
from app.core.db import AsyncSession, get_session
from app.models.iam import CompanyMembership

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

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
            except Exception as e:
                pass

        # 2. Bypass check for public endpoints
        path = request.url.path
        public_paths = [
            "/health", "/docs", "/openapi.json", 
            "/auth/login", "/auth/sync", 
            "/onboarding", "/datasources", 
            "/company/me", "/users",
            "/dev/",
            "/integrations/shopify/callback",
            "/integrations/shopify/install",
            "/integrations/shopify/rate-limit-test",
            "/integrations/shopify/validate-shop",
            "/integrations/shopify/auth/url"
        ]
        
        # Check if path starts with any public path OR contains /webhooks/ OR is exactly /
        if path == "/" or any(p in path for p in public_paths) or "/webhooks/" in path:
            return await call_next(request)

        # 3. Validation
        if not auth_header:
             return JSONResponse(content={"detail": "Unauthorized: Missing Auth Header"}, status_code=401)

        company_id_str = request.headers.get("X-Company-ID")
        workspace_id_str = request.headers.get("X-Workspace-ID")

        if not company_id_str:
            return JSONResponse(content={"detail": "Forbidden: Missing X-Company-ID"}, status_code=403)

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
            return JSONResponse(content={"detail": f"Bad Request: Invalid UUID format in headers ({company_id_str})"}, status_code=400)

        # 4. Membership Check
        if not user_id:
             return JSONResponse(content={"detail": "Unauthorized: Invalid Token (No User ID)"}, status_code=401)

        try:
            session_gen = get_session()
            session = await session_gen.__anext__()
            try:
                stmt = select(CompanyMembership).where(
                    CompanyMembership.company_id == company_id,
                    CompanyMembership.user_id == user_id
                )
                membership = (await session.exec(stmt)).first()
                
                if not membership:
                    return JSONResponse(content={"detail": f"Forbidden: User {user_id} is not a member of Company {company_id}"}, status_code=403)
                
                request.state.role = membership.role
            finally:
                await session.close()
        except Exception as e:
            import traceback
            logger.error(f"TenantMiddleware Error: {str(e)}\n{traceback.format_exc()}")
            return JSONResponse(
                content={"detail": "Internal Server Error in Tenant Verification", "error": str(e)}, 
                status_code=500
            )
            
        response = await call_next(request)
        return response
