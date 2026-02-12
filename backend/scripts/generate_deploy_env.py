
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
    
    # Robust Regex Parsing to isolate user/pass
    # Extract user:pass (everything between // and @)
    user_pass_match = re.search(r'://([^@]+)@', db_secret)
    if user_pass_match:
        user_pass = user_pass_match.group(1)
    else:
        print("WARNING: Could not extract user:pass from DB_SECRET, attempting fallback split")
        try:
            # Fallback: simple split if regex fails
            user_pass = db_secret.split('://')[1].split('@')[0]
        except:
            user_pass = ""
            print("ERROR: Failed to extract user:pass entirely.")

    # Force proper asyncpg format with Unix socket
    # Format: postgresql+asyncpg://USER:PASS@/postgres?host=/cloudsql/INSTANCE
    unix_socket_url = f"postgresql+asyncpg://{user_pass}@/postgres?host=/cloudsql/{instance_connection_name}"
    
    # Mask password for logging
    masked_url = unix_socket_url
    if user_pass and ":" in user_pass:
            p = user_pass.split(':')[1]
            masked_url = masked_url.replace(p, '***')
    
    print(f"Constructed URL: {masked_url}")

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
