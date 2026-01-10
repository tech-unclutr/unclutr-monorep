import pytest
import uuid
import json
from urllib.parse import urlparse, parse_qs
from cryptography.fernet import Fernet
from app.services.shopify.oauth_service import ShopifyOAuthService, shopify_oauth_service
from app.core.config import settings

# Mock Settings if needed, but we rely on current env for test.
# Ideally use a fixture to seed random keys.

@pytest.mark.asyncio
async def test_generate_authorization_url_structure():
    """Test if Auth URL is generated with correct params and encoded state."""
    company_id = uuid.uuid4()
    shop = "test-store.myshopify.com"
    
    url = await shopify_oauth_service.generate_authorization_url(shop, company_id)
    
    parsed = urlparse(url)
    assert parsed.scheme == "https"
    assert parsed.netloc == "test-store.myshopify.com"
    assert parsed.path == "/admin/oauth/authorize"
    
    params = parse_qs(parsed.query)
    assert params["client_id"][0] == settings.SHOPIFY_API_KEY
    assert "read_orders" in params["scope"][0]
    assert params["redirect_uri"][0] == f"{settings.BACKEND_URL}/api/v1/integrations/shopify/callback"
    
    # Verify State
    state_token = params["state"][0]
    assert state_token is not None
    
    # Decrypt state
    decoded_company = shopify_oauth_service.validate_state_and_get_company(state_token)
    assert decoded_company == str(company_id)

@pytest.mark.asyncio
async def test_hmac_verification():
    """Test HMAC validation logic."""
    # Create a dummy params dict
    params = {
        "shop": "test.myshopify.com",
        "timestamp": "1234567890",
        "code": "xyz"
    }
    
    # Manually sign it
    import hmac, hashlib
    sorted_params = sorted(params.items())
    msg = "&".join([f"{k}={v}" for k, v in sorted_params])
    signature = hmac.new(
        settings.SHOPIFY_API_SECRET.encode(),
        msg.encode(),
        hashlib.sha256
    ).hexdigest()
    
    params["hmac"] = signature
    
    # Verify
    assert shopify_oauth_service.verify_callback_hmac(params) == True
    
    # Test Tampering
    params["code"] = "abc" # changed
    assert shopify_oauth_service.verify_callback_hmac(params) == False

@pytest.mark.asyncio
async def test_token_encryption():
    """Test Fernet encryption cycle."""
    original_token = "shp_1234567890abcdef"
    encrypted = shopify_oauth_service.encrypt_token(original_token)
    
    assert encrypted != original_token
    assert "shp_" not in encrypted # Should be obscured
    
    decrypted = shopify_oauth_service.decrypt_token(encrypted)
    assert decrypted == original_token
