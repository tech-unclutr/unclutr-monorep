
import os
import firebase_admin
from firebase_admin import credentials
import sys

# Mock settings
class Settings:
    _BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
    FIREBASE_CREDENTIALS_PATH = os.path.join(_BACKEND_DIR, "firebase-credentials.json")
    FIREBASE_CREDENTIALS_JSON = None

settings = Settings()

print(f"Checking path: {settings.FIREBASE_CREDENTIALS_PATH}")
if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
    print("File exists!")
    try:
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        print("Credentials loaded successfully.")
    except Exception as e:
        print(f"Error loading credentials: {e}")
else:
    print("File DOES NOT exist.")

print(f"Current Admin Apps: {firebase_admin._apps}")
