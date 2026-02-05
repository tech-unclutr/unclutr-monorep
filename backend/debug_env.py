from app.core.config import settings
import os

print(f"GOOGLE_CLIENT_ID: |{settings.GOOGLE_CLIENT_ID}|")
print(f"GOOGLE_REDIRECT_URI: |{settings.GOOGLE_REDIRECT_URI}|")
print(f"OAUTHLIB_INSECURE_TRANSPORT (env): {os.environ.get('OAUTHLIB_INSECURE_TRANSPORT')}")
