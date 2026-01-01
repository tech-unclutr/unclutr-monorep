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
        
        logger.info("=" * 80)
        logger.info("🔵 INCOMING REQUEST")
        logger.info("=" * 80)
        logger.info(f"Method: {request.method}")
        logger.info(f"URL: {request.url}")
        logger.info(f"Path: {request.url.path}")
        logger.info(f"Query Params: {dict(request.query_params)}")
        logger.info(f"Headers: {dict(request.headers)}")
        if request_body:
            logger.info(f"Body: {request_body}")
        logger.info("=" * 80)
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log response
        logger.info("=" * 80)
        logger.info("🟢 OUTGOING RESPONSE")
        logger.info("=" * 80)
        logger.info(f"Status Code: {response.status_code}")
        logger.info(f"Duration: {duration:.3f}s")
        logger.info(f"Headers: {dict(response.headers)}")
        logger.info("=" * 80)
        
        return response

