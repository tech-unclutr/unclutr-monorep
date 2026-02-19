
import asyncio
import os
from urllib.parse import urlparse, urlunparse

async def test():
    # Simulate the logic in deploy.yml
    db_secret = "postgresql+asyncpg://user:pass@34.100.149.2:5432/postgres"
    
    url = urlparse(db_secret)
    instance_connection_name = 'unclutr-monorep:asia-south1:unclutr-db-india'
    
    if '@' in url.netloc:
        user_pass = url.netloc.rsplit('@', 1)[0]
        new_netloc = user_pass + '@'
    else:
        new_netloc = '' 
    
    new_query = f'host=/cloudsql/{instance_connection_name}'
    
    unix_socket_url = urlunparse((
        'postgresql+asyncpg',
        new_netloc,
        url.path,
        '',
        new_query,
        ''
    ))
    
    print(f"Generated URL: {unix_socket_url}")
    
    # Simulate DB.py parsing
    parsed = urlparse(unix_socket_url)
    print(f"Parsed Netloc: {parsed.netloc}")
    print(f"Parsed Path: {parsed.path}")
    print(f"Parsed Query: {parsed.query}")
    print(f"Is Unix Socket: {'/cloudsql/' in unix_socket_url}")

if __name__ == "__main__":
    asyncio.run(test())
