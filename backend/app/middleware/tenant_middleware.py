from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response, HTTPException
import uuid
from app.core.security import get_current_user_no_depends
from app.core.context import set_company_ctx, set_workspace_ctx, set_user_ctx
from sqlmodel import select
from app.core.db import AsyncSession, get_session
from app.models.iam import CompanyMembership

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Extract and Verify Auth (Always attempt if header is present)
        # This allows "public" or "onboarding" routes to still have a user context if they send a token.
        auth_header = request.headers.get("Authorization")
        if auth_header:
            try:
                decoded_token = await get_current_user_no_depends(auth_header)
                user_id = decoded_token.get("uid")
                set_user_ctx(user_id)
                request.state.user_id = user_id
            except Exception as e:
                # If auth fails but the route is in the bypass list, we ignore the error
                # and let the route handler decide (or just proceed as anonymous).
                # If it's a protected route not in bypass, we should probably fail, 
                # but for simplicity in this middleware, we'll let the endpoint's Security dependency handle the 401
                # if the user context isn't set.
                pass

        # 2. Bypass check for public/onboarding routes (Skipping Company Checks)
        path = request.url.path
        if any(p in path for p in ["/health", "/docs", "/openapi.json", "/auth/login", "/auth/sync", "/onboarding", "/datasources"]):
            return await call_next(request)

        # 3. For all other routes, enforce Auth if it wasn't successful above
        if not auth_header:
             return Response(content="Unauthorized: Missing Auth Header", status_code=401)

        # 3. Handle Company Context
        company_id_str = request.headers.get("X-Company-ID")
        workspace_id_str = request.headers.get("X-Workspace-ID")

        if not company_id_str:
            return Response(content="Forbidden: Missing X-Company-ID", status_code=403)

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
            return Response(content="Bad Request: Invalid UUID format in headers", status_code=400)

        # 4. Mandatory Membership Check (The "No-Guessing" Guardrail)
        # Verify that the user is actually a member of the requested company.
        # This prevents a user from providing a valid UUID of a company they don't belong to.
        
        # Note: In production, this should be cached (Redis) to avoid a DB hit per request.
        session_gen = get_session()
        session = await session_gen.__anext__()
        try:
            stmt = select(CompanyMembership).where(
                CompanyMembership.company_id == company_id,
                CompanyMembership.user_id == user_id
            )
            membership = (await session.exec(stmt)).first()
            
            if not membership:
                return Response(content="Forbidden: You are not a member of this company", status_code=403)
            
            request.state.role = membership.role
        finally:
            await session.close()
            
        response = await call_next(request)
        return response
