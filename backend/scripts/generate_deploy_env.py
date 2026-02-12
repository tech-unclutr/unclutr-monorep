
import os
import json
import re
import sys

def main():
    print("DEBUG: Starting generate_deploy_env.py")
    
    # Get base secret
    db_secret = os.environ.get('DATABASE_URL_SECRET', '')
    
    # Cloud SQL Instance Connection Name
    instance_connection_name = 'unclutr-monorep:asia-south1:unclutr-db-india'
    
    print(f"DEBUG: Processing DB Secret (Length: {len(db_secret)})")
    
    # Parse DB Secret safely
    try:
        from urllib.parse import urlparse
        
        url = urlparse(db_secret)
        
        # Extract components
        user = url.username
        password = url.password
        dbname = url.path.lstrip('/') if url.path else 'postgres'
        
        # Construct credentials string
        if password:
            creds = f"{user}:{password}"
        else:
            creds = user
            
        print(f"DEBUG: Parsed DB Name: {dbname}")
        
        # Construct Unix Socket URL for Cloud Run
        # Format: postgresql+asyncpg://USER:PASS@/DBNAME?host=/cloudsql/INSTANCE
        unix_socket_url = f"postgresql+asyncpg://{creds}@/{dbname}?host=/cloudsql/{instance_connection_name}"
        
        # Mask password for logging
        masked_url = unix_socket_url.replace(password, '***') if password else unix_socket_url
        print(f"Constructed URL: {masked_url}")
        
    except Exception as e:
        print(f"ERROR: Failed to parse DATABASE_URL_SECRET: {e}")
        # Fallback to original buggy behavior if parsing fails entirely, or exit? 
        # Better to exit as this is critical
        sys.exit(1)

    # Construct environment variables dictionary
    env_vars = {
        'DATABASE_URL': unix_socket_url,
        'ENVIRONMENT': os.environ.get('ENVIRONMENT_NAME'),
        'BACKEND_URL': os.environ.get('BASE_URL'),
        'FRONTEND_URL': os.environ.get('BASE_URL'),
        'GOOGLE_CLIENT_ID': os.environ.get('GOOGLE_CLIENT_ID_SECRET'),
        'GOOGLE_CLIENT_SECRET': os.environ.get('GOOGLE_CLIENT_SECRET_SECRET'),
        # Handle f-string construction safely in python file
        'GOOGLE_REDIRECT_URI': f"{os.environ.get('BASE_URL')}/api/v1/intelligence/calendar/google/callback",
        'SHOPIFY_ENCRYPTION_KEY': os.environ.get('SHOPIFY_ENCRYPTION_KEY_SECRET'),
        'SHOPIFY_API_KEY': os.environ.get('SHOPIFY_API_KEY_SECRET'),
        'SHOPIFY_API_SECRET': os.environ.get('SHOPIFY_API_SECRET_SECRET'),
        'GEMINI_API_KEY': os.environ.get('GEMINI_API_KEY_SECRET'),
        'FIREBASE_CREDENTIALS_JSON': os.environ.get('FIREBASE_CREDENTIALS_JSON_SECRET')
    }

    # Remove any None values
    env_vars = {k: v for k, v in env_vars.items() if v is not None}
    
    # Write to env.json
    try:
        with open('env.json', 'w') as f:
            json.dump(env_vars, f, indent=2)
        print("SUCCESS: env.json created successfully.")
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to write env.json: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
