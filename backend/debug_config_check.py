
import os
from app.core.config import settings

print(f"Active Environment: {settings.ENVIRONMENT}")
print(f"Active Database URL: {settings.DATABASE_URL}")

# Check if .env content actually matches
try:
    with open(".env", "r") as f:
        print("\n--- .env Content (First 20 lines) ---")
        print("\n".join(f.readlines()[:20]))
except Exception as e:
    print(f"Could not read .env: {e}")
