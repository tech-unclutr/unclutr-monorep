import time
import json
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import logging

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all API requests and responses with detailed information.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Start timer
        start_time = time.time()
        
        # Log request
        request_body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body_bytes = await request.body()
                if body_bytes:
                    request_body = body_bytes.decode()
                    # Re-create request with body for downstream handlers
                    async def receive():
                        return {"type": "http.request", "body": body_bytes}
                    request._receive = receive
            except Exception as e:
                logger.error(f"Error reading request body: {e}")
        
        print("\n" + "="*80)
        print(f"🔵 INCOMING REQUEST")
        print("="*80)
        print(f"Method: {request.method}")
        print(f"URL: {request.url}")
        print(f"Path: {request.url.path}")
        print(f"Query Params: {dict(request.query_params)}")
        print(f"Headers: {dict(request.headers)}")
        if request_body:
            print(f"Body: {request_body}")
        print("="*80 + "\n")
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log response
        print("\n" + "="*80)
        print(f"🟢 OUTGOING RESPONSE")
        print("="*80)
        print(f"Status Code: {response.status_code}")
        print(f"Duration: {duration:.3f}s")
        print(f"Headers: {dict(response.headers)}")
        print("="*80 + "\n")
        
        return response
