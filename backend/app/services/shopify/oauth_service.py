import hmac
import hashlib
import base64
import uuid
import json
import time
from typing import Dict, Optional, Tuple
from urllib.parse import urlencode, urlparse, parse_qs
from datetime import datetime

import httpx
from cryptography.fernet import Fernet
from fastapi import HTTPException, status
from loguru import logger
from sqlmodel.ext.asyncio.session import AsyncSession 

from app.core.config import settings
from app.models.integration import Integration, IntegrationStatus
from app.models.company import Company

class ShopifyOAuthService:
    """
    Handles the Shopify OAuth handshake flow, token encryption, and validation.
    Implements 'authenticated symmetric encryption' (Fernet) for credential storage.
    """
    
    API_VERSION = "2024-01"  # Or your specific pinned version
    # Updated Scopes for Analytics Read-Only v1
    SCOPES = [
        "read_products", 
        "read_orders", 
        "read_customers", 
        "read_inventory", 
        "read_marketing_events", 
        "read_checkouts",
        "read_all_orders"
    ]

    def __init__(self):
        self.api_key = settings.SHOPIFY_API_KEY
        self.api_secret = settings.SHOPIFY_API_SECRET
        self.backend_url = settings.BACKEND_URL
        
        # Initialize Fernet Cipher for Token Encryption
        if settings.SHOPIFY_ENCRYPTION_KEY:
            try:
                # Ensure key is bytes
                key_bytes = settings.SHOPIFY_ENCRYPTION_KEY.encode() if isinstance(settings.SHOPIFY_ENCRYPTION_KEY, str) else settings.SHOPIFY_ENCRYPTION_KEY
                self.cipher = Fernet(key_bytes)
            except Exception as e:
                logger.critical(f"Failed to initialize Shopify encryption key: {e}")
                raise RuntimeError("SHOPIFY_ENCRYPTION_KEY is invalid.")
        else:
            logger.critical("SHOPIFY_ENCRYPTION_KEY is missing!")
            raise RuntimeError("SHOPIFY_ENCRYPTION_KEY must be set.")

    # --- Encryption Helpers ---

    def encrypt_token(self, token: str) -> str:
        """Encrypts a plaintext Access Token to a Fernet string."""
        return self.cipher.encrypt(token.encode()).decode()

    def decrypt_token(self, encrypted_token: str) -> str:
        """Decrypts a Fernet string back to plaintext Access Token."""
        return self.cipher.decrypt(encrypted_token.encode()).decode()

    async def get_access_token(self, integration_id: uuid.UUID, session: AsyncSession) -> str:
        """Retrieves and decrypts the access token for an integration."""
        integration = await session.get(Integration, integration_id)
        if not integration or not integration.credentials:
            raise ValueError("Integration not found or missing credentials")
        
        credentials = integration.credentials
        encrypted_token = credentials.get("access_token")
        
        if not encrypted_token:
            raise ValueError("No access token found in credentials")
            
        return self.decrypt_token(encrypted_token)

    # --- OAuth Flow ---

    async def generate_authorization_url(self, shop_domain: str, company_id: uuid.UUID) -> str:
        """
        Generates the Shopify OAuth redirection URL.
        Encodes company_id in state to persist context through the callback.
        """
        # 1. Clean domain
        clean_shop = self._sanitize_shop_domain(shop_domain)
        if not clean_shop:
             raise HTTPException(status_code=400, detail="Invalid shop domain")

        # 2. Generate State (Signed Context)
        # Format: "company_id:random_nonce" -> Signed/Encrypted?
        # For V1 simplicity with Fernet available, let's just encrypt the JSON context!
        state_payload = json.dumps({
            "company_id": str(company_id),
            "nonce": str(uuid.uuid4())
        })
        state = self.encrypt_token(state_payload) # Using our Fernet instance
        
        # 3. Build Redirect URI
        redirect_uri = f"{self.backend_url}/api/v1/integrations/shopify/callback"

        params = {
            "client_id": self.api_key,
            "scope": ",".join(self.SCOPES),
            "redirect_uri": redirect_uri,
            "state": state, 
        }
        
        auth_url = f"https://{clean_shop}/admin/oauth/authorize?{urlencode(params)}"
        return auth_url

    def validate_state_and_get_company(self, state: str) -> str:
        """Decrypts state and returns company_id."""
        try:
            decrypted = self.decrypt_token(state)
            data = json.loads(decrypted)
            return data.get("company_id")
        except Exception:
            # If decryption fails, state was tampered or invalid
            return None

    async def validate_shop_domain(self, shop_domain: str) -> bool:
        """Validates if a connection can be established to the shop."""
        clean_shop = self._sanitize_shop_domain(shop_domain)
        if not clean_shop:
            logger.warning(f"Validation failed: Invalid format for {shop_domain}")
            return False
            
        # Light check: Head request to shop admin login
        async with httpx.AsyncClient() as client:
            try:
                url = f"https://{clean_shop}/admin"
                logger.info(f"Validating Shop Reachability: {url}")
                resp = await client.head(url, timeout=5.0)
                logger.info(f"Shop Validation Response: {resp.status_code}")
                # 303 (See Other) is often used by Shopify for admin redirects
                return resp.status_code == 200 or resp.status_code == 302 or resp.status_code == 301 or resp.status_code == 303
            except httpx.RequestError as e:
                logger.error(f"Shop Validation Connection Error: {e}")
                return False

    async def exchange_code_for_token(self, shop_domain: str, code: str) -> str:
        """
        Exchanges the temporary Auth Code for a permanent Access Token.
        """
        clean_shop = self._sanitize_shop_domain(shop_domain)
        url = f"https://{clean_shop}/admin/oauth/access_token"
        
        payload = {
            "client_id": self.api_key,
            "client_secret": self.api_secret,
            "code": code
        }
        
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                logger.error(f"Shopify Token Exchange Failed: {resp.text}")
                raise HTTPException(status_code=400, detail="Failed to exchange token with Shopify")
            
            data = resp.json()
            return data.get("access_token")

    def verify_callback_hmac(self, params: Dict[str, str]) -> bool:
        """
        Verifies the HMAC signature of the callback request from Shopify.
        Critical security step.
        """
        if "hmac" not in params:
            return False
            
        received_hmac = params["hmac"]
        
        # Sort params lexicographically, excluding hmac
        sorted_params = sorted([(k, v) for k, v in params.items() if k != "hmac"])
        status_string = "&".join([f"{k}={v}" for k, v in sorted_params])
        
        # Compute HMAC-SHA256
        digest = hmac.new(
            self.api_secret.encode("utf-8"),
            status_string.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(digest, received_hmac)

    def verify_webhook_hmac(self, body_bytes: bytes, hmac_header: str) -> bool:
        """
        Verifies the HMAC signature of a Webhook request.
        Uses the raw body bytes and the SHA256 header.
        """
        if not hmac_header:
            return False
            
        digest = hmac.new(
            self.api_secret.encode("utf-8"),
            body_bytes,
            hashlib.sha256
        ).digest()
        
        computed_hmac = base64.b64encode(digest).decode()
        
        return hmac.compare_digest(computed_hmac, hmac_header)

    async def register_webhooks(self, shop_domain: str, access_token: str):
        """
        Subscribes to important Shopify Webhook topics.
        """
        topics = [
            "orders/create",
            "orders/updated",
            "orders/delete",
            "products/create",
            "products/update",
            "products/delete",
            "customers/create",
            "customers/update",
            "customers/delete",
            "price_rules/create",
            "price_rules/update",
            "price_rules/delete"
        ]
        
        async with httpx.AsyncClient() as client:
            for topic in topics:
                # Use hyphens for URL if preferred, but our path param now handles slashes
                # Let's keep it simple: matches the topic name
                address = f"{self.backend_url}/api/v1/integrations/shopify/webhooks/{topic}"
                
                url = f"https://{shop_domain}/admin/api/{self.API_VERSION}/webhooks.json"
                headers = {
                    "X-Shopify-Access-Token": access_token,
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "webhook": {
                        "topic": topic,
                        "address": address,
                        "format": "json"
                    }
                }
                
                try:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 201:
                        logger.info(f"Registered webhook {topic} for {shop_domain}")
                    elif resp.status_code == 422:
                        # Likely already exists
                        logger.debug(f"Webhook {topic} already exists for {shop_domain}")
                    else:
                        logger.error(f"Failed to register webhook {topic}: {resp.text}")
                except Exception as e:
                    logger.error(f"Error registering webhook {topic}: {e}")

    # --- Utilities ---

    def _sanitize_shop_domain(self, domain: str) -> Optional[str]:
        """Ensures domain is 'foo.myshopify.com' format."""
        domain = domain.strip().lower()
        
        # Remove protocol
        if "://" in domain:
            domain = domain.split("://")[-1]
        
        # Remove paths
        if "/" in domain:
            domain = domain.split("/")[0]
            
        # Add suffix if missing (user might just type 'unclutr-dev')
        if not domain.endswith(".myshopify.com"):
            domain += ".myshopify.com"
            
        # Basic character check
        allowed_chars = "abcdefghijklmnopqrstuvwxyz0123456789-."
        if not all(c in allowed_chars for c in domain):
            return None
            
        return domain

shopify_oauth_service = ShopifyOAuthService()
