#!/usr/bin/env python3
"""
Quick diagnostic script to verify Google OAuth configuration
"""
import os
import sys

# Add backend to path
sys.path.insert(0, '/Users/param/Documents/Unclutr/backend')

from app.core.config import settings

print("=" * 60)
print("Google OAuth Configuration Check")
print("=" * 60)
print(f"Client ID: {settings.GOOGLE_CLIENT_ID}")
print(f"Client Secret: {settings.GOOGLE_CLIENT_SECRET[:20]}..." if settings.GOOGLE_CLIENT_SECRET else "None")
print(f"Redirect URI: {settings.GOOGLE_REDIRECT_URI}")
print("=" * 60)

# Verify the client ID format
if settings.GOOGLE_CLIENT_ID:
    if settings.GOOGLE_CLIENT_ID.endswith('.apps.googleusercontent.com'):
        print("✅ Client ID format looks correct")
    else:
        print("❌ Client ID format looks incorrect")
else:
    print("❌ Client ID is not set")

# Verify the client secret format
if settings.GOOGLE_CLIENT_SECRET:
    if settings.GOOGLE_CLIENT_SECRET.startswith('GOCSPX-'):
        print("✅ Client Secret format looks correct")
    else:
        print("❌ Client Secret format looks incorrect")
else:
    print("❌ Client Secret is not set")

print("=" * 60)
