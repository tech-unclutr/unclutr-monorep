"""
Shopify OAuth Service
Handles OAuth 2.0 flow for Shopify integration
"""
from typing import Optional, Dict
import uuid
import secrets
import httpx
import json
from datetime import datetime, timedelta
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.core.config import settings
from app.models.integration import Integration, IntegrationStatus
from app.models.company import Workspace
from cryptography.fernet import Fernet
import base64
import logging

logger = logging.getLogger(__name__)

# OAuth scopes required for Shopify integration
SHOPIFY_SCOPES = [
    'read_orders',
    'read_products',
    'read_customers',
    'read_inventory',
    'read_analytics',
    'read_price_rules',
    'read_shipping',
    'read_locations',
]


class ShopifyOAuthService:
    """Service for handling Shopify OAuth flow"""
    
    def __init__(self):
        # Initialize encryption cipher
        if settings.SHOPIFY_ENCRYPTION_KEY:
            key = settings.SHOPIFY_ENCRYPTION_KEY.encode()
            self.cipher = Fernet(key)
        else:
            logger.warning("SHOPIFY_ENCRYPTION_KEY not set - token encryption disabled")
            self.cipher = None
    
    async def generate_authorization_url(
        self,
        company_id: uuid.UUID,
        shop_domain: str,
        session: AsyncSession
    ) -> Dict[str, str]:
        """
        Generate Shopify OAuth authorization URL
        
        Args:
            company_id: Company ID requesting authorization
            shop_domain: Shopify shop domain (e.g., mystore.myshopify.com)
            session: Database session
            
        Returns:
            Dict with auth_url, state, and shop
        """
        # Normalize shop domain
        shop = shop_domain.strip().lower().replace('.myshopify.com', '')
        full_shop = f"{shop}.myshopify.com"
        
        # Generate secure state token for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Store state temporarily (in-memory for now, should use Redis in production)
        # TODO: Implement Redis-based state storage with expiration
        await self._store_oauth_state(state, {
            "company_id": str(company_id),
            "shop": full_shop,
            "created_at": datetime.utcnow().isoformat()
        })
        
        # Build OAuth URL
        redirect_uri = f"{settings.BACKEND_URL}/api/v1/integrations/shopify/callback"
        scopes_str = ','.join(SHOPIFY_SCOPES)
        
        auth_url = (
            f"https://{full_shop}/admin/oauth/authorize?"
            f"client_id={settings.SHOPIFY_API_KEY}&"
            f"scope={scopes_str}&"
            f"redirect_uri={redirect_uri}&"
            f"state={state}"
        )
        
        logger.info(
            "Generated Shopify OAuth URL",
            extra={
                "company_id": str(company_id),
                "shop": full_shop,
                "state": state[:8] + "..."  # Log only first 8 chars
            }
        )
        
        return {
            "auth_url": auth_url,
            "state": state,
            "shop": full_shop
        }
    
    async def handle_callback(
        self,
        code: str,
        shop: str,
        state: str,
        hmac_param: str,
        session: AsyncSession
    ) -> Integration:
        """
        Handle OAuth callback and exchange code for access token
        
        Args:
            code: Authorization code from Shopify
            shop: Shop domain
            state: State token for CSRF verification
            hmac_param: HMAC signature from Shopify
            session: Database session
            
        Returns:
            Created/updated Integration record
        """
        # 1. Verify state token
        state_data = await self._get_oauth_state(state)
        if not state_data:
            raise ValueError("Invalid or expired state token")
        
        company_id = uuid.UUID(state_data["company_id"])
        expected_shop = state_data["shop"]
        
        if shop != expected_shop:
            raise ValueError(f"Shop mismatch: expected {expected_shop}, got {shop}")
        
        # 2. Verify HMAC (TODO: Implement HMAC validation)
        # self._verify_hmac(params, hmac_param)
        
        # 3. Exchange code for access token
        access_token = await self._exchange_code_for_token(shop, code)
        
        # 4. Get shop information
        shop_info = await self._get_shop_info(shop, access_token)
        
        # 5. Get or create workspace
        workspace = await self._get_or_create_workspace(company_id, session)
        
        # 6. Get datasource ID for Shopify
        from app.models.datasource import DataSource
        datasource = await session.exec(
            select(DataSource).where(DataSource.slug == "shopify")
        )
        datasource = datasource.first()
        
        if not datasource:
            raise ValueError("Shopify datasource not found in database")
        
        # 7. Create or update integration
        existing = await session.exec(
            select(Integration).where(
                Integration.company_id == company_id,
                Integration.datasource_id == datasource.id
            )
        )
        integration = existing.first()
        
        if not integration:
            integration = Integration(
                company_id=company_id,
                workspace_id=workspace.id,
                datasource_id=datasource.id,
                status=IntegrationStatus.ACTIVE
            )
        else:
            integration.status = IntegrationStatus.ACTIVE
        
        # 8. Store encrypted access token
        await self._store_access_token(integration, access_token)
        
        # 9. Store shop configuration
        integration.config = {
            "shop_domain": shop,
            "shop_name": shop_info.get("name", shop),
            "shop_plan": shop_info.get("plan_name", "unknown"),
            "sync_mode": "realtime",
            "historical_range_months": 12,  # Default
            "initial_sync_completed": False
        }
        
        integration.metadata_info = {
            "shop_id": shop_info.get("id"),
            "shop_email": shop_info.get("email"),
            "shop_currency": shop_info.get("currency"),
            "shop_timezone": shop_info.get("iana_timezone")
        }
        
        integration.last_sync_at = datetime.utcnow()
        
        session.add(integration)
        await session.commit()
        await session.refresh(integration)
        
        logger.info(
            "Shopify OAuth completed",
            extra={
                "company_id": str(company_id),
                "integration_id": str(integration.id),
                "shop": shop
            }
        )
        
        # Delete state (one-time use)
        await self._delete_oauth_state(state)
        
        return integration
    
    async def _exchange_code_for_token(self, shop: str, code: str) -> str:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://{shop}/admin/oauth/access_token",
                json={
                    'client_id': settings.SHOPIFY_API_KEY,
                    'client_secret': settings.SHOPIFY_API_SECRET,
                    'code': code
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return data['access_token']
    
    async def _get_shop_info(self, shop: str, access_token: str) -> Dict:
        """Fetch shop information from Shopify API"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://{shop}/admin/api/2026-01/shop.json",
                headers={"X-Shopify-Access-Token": access_token},
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return data.get('shop', {})
    
    async def _store_access_token(self, integration: Integration, access_token: str):
        """Store encrypted access token in integration.credentials"""
        if self.cipher:
            # Encrypt token
            encrypted = self.cipher.encrypt(access_token.encode())
            encrypted_b64 = base64.b64encode(encrypted).decode()
            
            integration.credentials = {
                "access_token": encrypted_b64,
                "encrypted": True
            }
        else:
            # Fallback: store unencrypted (NOT RECOMMENDED FOR PRODUCTION)
            logger.warning("Storing access token unencrypted - set SHOPIFY_ENCRYPTION_KEY")
            integration.credentials = {
                "access_token": access_token,
                "encrypted": False
            }
    
    async def get_access_token(
        self,
        integration: Integration
    ) -> str:
        """Retrieve and decrypt access token from integration"""
        if not integration.credentials:
            raise ValueError("No credentials stored for integration")
        
        if integration.credentials.get("encrypted"):
            if not self.cipher:
                raise ValueError("Encryption key not configured")
            
            # Decrypt token
            encrypted_b64 = integration.credentials["access_token"]
            encrypted = base64.b64decode(encrypted_b64)
            decrypted = self.cipher.decrypt(encrypted)
            return decrypted.decode()
        else:
            # Unencrypted fallback
            return integration.credentials["access_token"]
    
    async def _get_or_create_workspace(
        self,
        company_id: uuid.UUID,
        session: AsyncSession
    ) -> Workspace:
        """Get or create primary workspace for company"""
        workspace = await session.exec(
            select(Workspace).where(Workspace.company_id == company_id).limit(1)
        )
        workspace = workspace.first()
        
        if not workspace:
            raise ValueError(f"No workspace found for company {company_id}")
        
        return workspace
    
    # Temporary in-memory state storage (replace with Redis in production)
    _oauth_states: Dict[str, Dict] = {}
    
    async def _store_oauth_state(self, state: str, data: Dict):
        """Store OAuth state temporarily"""
        self._oauth_states[state] = data
    
    async def _get_oauth_state(self, state: str) -> Optional[Dict]:
        """Retrieve OAuth state"""
        return self._oauth_states.get(state)
    
    async def _delete_oauth_state(self, state: str):
        """Delete OAuth state after use"""
        self._oauth_states.pop(state, None)
