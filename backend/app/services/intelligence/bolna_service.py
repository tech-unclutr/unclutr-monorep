"""
Bolna Voice AI Service

Handles all interactions with Bolna API for phone interviews.
"""

import httpx
from typing import Dict, Any, Optional
from loguru import logger
from app.core.config import settings

class BolnaService:
    """Service for interacting with Bolna Voice AI API"""
    
    def __init__(self):
        self.api_base_url = getattr(settings, 'BOLNA_API_BASE_URL', 'https://api.bolna.ai')
        self.api_key = getattr(settings, 'BOLNA_API_KEY', None)
        self.agent_id = getattr(settings, 'BOLNA_AGENT_ID', None)
        
        if not self.api_key:
            logger.warning("BOLNA_API_KEY not configured")
        if not self.agent_id:
            logger.warning("BOLNA_AGENT_ID not configured")
    
    def _get_headers(self) -> Dict[str, str]:
        """Build authentication headers for Bolna API"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def trigger_phone_call(
        self,
        phone_number: str,
        user_full_name: str,
        company_id: str,
        user_id: str,
        campaign_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Trigger a phone call via Bolna API.
        
        Args:
            phone_number: E.164 formatted phone number (e.g., +14155551234)
            user_full_name: Full name of the team member
            company_id: Company UUID
            user_id: User ID
            campaign_id: Optional Campaign UUID if retrying
            
        Returns:
            Dict with execution_id and other call metadata
            
        Raises:
            httpx.HTTPError: If API call fails
        """
        if not self.api_key or not self.agent_id:
            raise ValueError("Bolna API credentials not configured")
        
        url = f"{self.api_base_url}/call"
        
        payload = {
            "agent_id": self.agent_id,
            "recipient_phone_number": phone_number,
            "context_data": {
                "team_member_name": user_full_name,
                "company_id": company_id,
                "user_id": user_id,
                "campaign_id": campaign_id
            }
        }
        
        logger.info(f"Triggering Bolna call to {phone_number} for user {user_full_name}")
        logger.info(f"Bolna payload: {payload}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self._get_headers()
                )
                response.raise_for_status()
                data = response.json()
            except httpx.HTTPStatusError as e:
                # Log the full error response from Bolna
                error_body = e.response.text
                logger.error(f"Bolna API error: {e.response.status_code} - {error_body}")
                logger.error(f"Request payload was: {payload}")
                
                # Try to parse the error message
                try:
                    error_json = e.response.json()
                    error_message = error_json.get("message", error_body)
                    
                    # Check for trial account restriction
                    if "trial" in error_message.lower() and "verified" in error_message.lower():
                        raise ValueError(
                            f"Bolna trial account restriction: {error_message}. "
                            "Please verify this phone number in your Bolna dashboard or upgrade your account."
                        )
                    
                    # Check for low wallet balance (misleading 404)
                    if e.response.status_code == 404 and "wallet balance" in error_message.lower():
                        raise ValueError(f"Bolna Error: {error_message}")
                        
                except Exception:
                    # If we can't parse the error, just re-raise the original
                    pass
                
                # If we parsed a message but didn't raise a specific ValueError above, 
                # try to raise a more helpful error than just the status code
                if 'error_message' in locals() and error_message:
                     raise httpx.HTTPStatusError(
                        f"Bolna API Error: {e.response.status_code} - {error_message}", 
                        request=e.request, 
                        response=e.response
                    ) from e

                raise
            
        logger.info(f"Bolna call triggered successfully. Full response: {data}")
        
        # Extract execution ID - Bolna might return it in different fields
        execution_id = data.get('id') or data.get('execution_id') or data.get('call_id')
        
        if execution_id:
            logger.info(f"Execution ID: {execution_id}")
        else:
            logger.error(f"No execution ID found in Bolna response: {data}")
            
        return data
    
    async def get_execution_details(self, execution_id: str) -> Dict[str, Any]:
        """
        Fetch execution details from Bolna API.
        
        Args:
            execution_id: Bolna execution ID
            
        Returns:
            Full execution data including transcript, extracted_data, etc.
        """
        if not self.api_key:
            raise ValueError("Bolna API key not configured")
        
        url = f"{self.api_base_url}/executions/{execution_id}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=self._get_headers())
            response.raise_for_status()
            return response.json()
    
    def parse_webhook_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse and validate webhook payload from Bolna.
        
        Expected payload structure:
        {
            "id": "execution_id",
            "agent_id": "agent_id",
            "status": "completed",
            "conversation_time": 180,
            "total_cost": 45,
            "transcript": "...",
            "extracted_data": {...},
            "telephony_data": {...},
            "created_at": "2024-01-23T01:14:37Z",
            "updated_at": "2024-01-29T18:31:22Z",
            "error_message": null
        }
        
        Returns:
            Validated and normalized payload
        """
        # LOGGING: Inspect key availability
        logger.info(f"Parsing Bolna payload. Keys: {list(payload.keys())}")
        
        # Extract context_data if available (it might be nested differently depending on Bolna version)
        context_data = payload.get("context_data", {})
        
        # Robust extracted_data retrieval
        extracted_data = payload.get("extracted_data", {})
        if not extracted_data and isinstance(context_data, dict):
            extracted_data = context_data.get("extracted_data", {})
            
        return {
            "execution_id": payload.get("id"),
            "agent_id": payload.get("agent_id"),
            "call_status": payload.get("status"),
            "status": payload.get("status"), # REQUIRED for CampaignGoalDetail model (it expects 'status')
            "conversation_time": payload.get("conversation_time"),
            "total_cost": payload.get("total_cost"),
            "transcript": payload.get("transcript", ""),
            "extracted_data": extracted_data,
            "telephony_data": payload.get("telephony_data", {}),
            "context_data": context_data,
            "campaign_id": context_data.get("campaign_id") if isinstance(context_data, dict) else None,
            "error_message": payload.get("error_message"),
            "created_at": payload.get("created_at"),
            "updated_at": payload.get("updated_at"),
            "raw_payload": payload # Pass through full raw payload explicitly
        }

bolna_service = BolnaService()
