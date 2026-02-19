import os
from urllib.parse import urlparse, urlunparse

def test_deploy_logic(db_secret):
    print(f"Testing input: {db_secret}")
    try:
        url = urlparse(db_secret)
        
        # Cloud SQL Instance Connection Name
        instance_connection_name = 'unclutr-monorep:asia-south1:unclutr-db-india'
        
        # Query params for Unix socket
        new_query = f'host=/cloudsql/{instance_connection_name}'
        
        if '@' in url.netloc:
            user_pass = url.netloc.rsplit('@', 1)[0]
        else:
            user_pass = url.netloc

        unix_socket_url = urlunparse((
            'postgresql+asyncpg',
            user_pass + '@', 
            url.path,
            '',
            new_query,
            ''
        ))
        print(f"Generated: {unix_socket_url}")
    except Exception as e:
        print(f"Error parsing DB URL: {e}")
        print(f"Fallback: {db_secret}")
    print("-" * 20)

# Test Scenarios
inputs = [
    "postgresql://postgres:Postgres123!@34.100.149.2:5432/postgres",
    "postgresql+asyncpg://postgres:Postgres123!@34.100.149.2:5432/postgres",
    "postgres://postgres:Postgres123!@34.100.149.2:5432/postgres",
    "postgresql://postgres:pass@/postgres?host=/cloudsql/instance",
]

for i in inputs:
    test_deploy_logic(i)
