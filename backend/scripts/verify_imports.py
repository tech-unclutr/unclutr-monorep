
import sys
import os
import logging

# Mock logging to stdout
logging.basicConfig(level=logging.DEBUG)

print(">>> STARTING IMPORT VERIFICATION <<<")

# Mock environment variables that might be needed
os.environ['DATABASE_URL'] = "sqlite+aiosqlite:///:memory:"
os.environ['SHOPIFY_ENCRYPTION_KEY'] = "test_key_must_be_32_url_safe_base64_bytes________________"
os.environ['ENVIRONMENT'] = "staging"

try:
    print("Attempting to import app.core.config...")
    from app.core import config
    print("SUCCESS: app.core.config")

    print("Attempting to import app.core.db...")
    from app.core import db
    print("SUCCESS: app.core.db")

    print("Attempting to import app.services.shopify.oauth_service...")
    from app.services.shopify.oauth_service import shopify_oauth_service
    print("SUCCESS: app.services.shopify.oauth_service")
    
    print("Attempting to import app.services.scheduler...")
    from app.services import scheduler
    print("SUCCESS: app.services.scheduler")

    print("Attempting to import app.main...")
    from app import main
    print("SUCCESS: app.main")
    
    print(">>> VERIFICATION COMPLETE: ALL IMPORTS SUCCESSFUL <<<")
    sys.exit(0)

except Exception as e:
    print(f"!!! IMPORT FAILED !!!")
    print(e)
    import traceback
    traceback.print_exc()
    sys.exit(1)
