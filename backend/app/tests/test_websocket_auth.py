
from unittest.mock import MagicMock, AsyncMock
import pytest
from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse
from starlette.websockets import WebSocket

from app.middleware.tenant_middleware import TenantMiddleware

# Mock dependencies
async def mock_call_next(request: Request):
    return JSONResponse(content={"status": "ok"}, status_code=200)

@pytest.mark.asyncio
async def test_tenant_middleware_websocket_upgrade_case_insensitive():
    """
    Test that TenantMiddleware correctly identifies WebSocket upgrade requests
    regardless of the casing of the 'Upgrade' header value.
    """
    app = FastAPI()
    middleware = TenantMiddleware(app)

    # Case 1: Lowercase 'websocket' (Standard)
    # Should pass through without Auth checks (simulated by returning 200 from call_next)
    headers_lower = {
        "upgrade": "websocket",
        "connection": "Upgrade",
        "host": "localhost"
    }
    request_lower = Request(scope={
        "type": "http",
        "method": "GET",
        "path": "/api/v1/execution/campaign/123/ws",
        "headers": [(k.encode(), v.encode()) for k, v in headers_lower.items()]
    })
    
    # We expect this to execute call_next, implying it bypassed the auth check 
    # (or we'd get a 401 because we provided no auth headers)
    response_lower = await middleware.dispatch(request_lower, mock_call_next)
    assert response_lower.status_code == 200, "Failed to identify 'websocket' upgrade"


    # Case 2: Mixed case 'WebSocket' (Browser/Proxy variation)
    # This is the regression test for the bug.
    headers_mixed = {
        "upgrade": "WebSocket",
        "connection": "Upgrade",
        "host": "localhost"
    }
    request_mixed = Request(scope={
        "type": "http",
        "method": "GET",
        "path": "/api/v1/execution/campaign/123/ws",
        "headers": [(k.encode(), v.encode()) for k, v in headers_mixed.items()]
    })
    
    response_mixed = await middleware.dispatch(request_mixed, mock_call_next)
    assert response_mixed.status_code == 200, "Failed to identify 'WebSocket' upgrade (Case Sensitivity Bug)"

@pytest.mark.asyncio
async def test_tenant_middleware_standard_http_requires_auth():
    """
    Verify that standard HTTP requests still require auth, ensuring we didn't break security.
    """
    app = FastAPI()
    middleware = TenantMiddleware(app)

    headers = {
        "host": "localhost"
    }
    request = Request(scope={
        "type": "http",
        "method": "GET",
        "path": "/api/v1/execution/campaign/123/stats", # Protected endpoint
        "headers": [(k.encode(), v.encode()) for k, v in headers.items()]
    })
    
    response = await middleware.dispatch(request, mock_call_next)
    assert response.status_code == 401, "Protected endpoint didn't require auth"
