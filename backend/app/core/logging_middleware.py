import json
import logging
import re
import time
from typing import Any

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Fields to redact for security
SENSITIVE_FIELDS = {
    "access_token", "code", "hmac", "state", "client_secret", 
    "password", "secret", "token", "credentials", "raw_body_base64"
}

def redact_data(data: Any) -> Any:
    """
    Recursively redacts sensitive fields from dictionaries and lists.
    """
    if isinstance(data, dict):
        return {
            k: "[REDACTED]" if k.lower() in SENSITIVE_FIELDS else redact_data(v)
            for k, v in data.items()
        }
    elif isinstance(data, list):
        return [redact_data(item) for item in data]
    return data

def redact_json_string(json_str: str) -> str:
    """
    Attempts to parse a string as JSON and redact sensitive fields.
    If parsing fails, returns original or applies regex.
    """
    try:
        data = json.loads(json_str)
        redacted = redact_data(data)
        return json.dumps(redacted)
    except Exception:
        # Basic regex fallback for non-json or malformed strings
        redacted_str = json_str
        for field in SENSITIVE_FIELDS:
            # Matches "field": "value" or field=value
            redacted_str = re.sub(
                rf'({field}["\']?\s*[:=]\s*["\']?)[^"\'\s&,]*', 
                r'\1[REDACTED]', 
                redacted_str, 
                flags=re.IGNORECASE
            )
        return redacted_str

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all API requests and responses with detailed information,
    while ensuring sensitive data is redacted.
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
        
        # Redact Query Params & Headers
        redacted_query = redact_data(dict(request.query_params))
        redacted_headers = redact_data(dict(request.headers))
        
        logger.info("=" * 80)
        logger.info("🔵 INCOMING REQUEST")
        logger.info("=" * 80)
        logger.info(f"Method: {request.method} | URL: {request.url.path}")
        if redacted_query:
            logger.info(f"Query Params: {redacted_query}")
        logger.info(f"Headers: {redacted_headers}")
        if request_body:
            logger.info(f"Body: {redact_json_string(request_body)}")
        logger.info("=" * 80)
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log response
        logger.info("=" * 80)
        logger.info("🟢 OUTGOING RESPONSE")
        logger.info("=" * 80)
        logger.info(f"Status Code: {response.status_code} | Duration: {duration:.3f}s")
        # Optimization: Only log response headers if not 200/201? 
        # For now, let's keep headers but redact.
        logger.info(f"Headers: {redact_data(dict(response.headers))}")
        logger.info("=" * 80)
        
        return response

