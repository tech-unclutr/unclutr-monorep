import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import make_url

async def test():
    # Test Case 1: With localhost
    url_with_localhost = "postgresql+asyncpg://user:pass@localhost/dbname?host=/cloudsql/project:region:instance"
    print(f"Testing URL: {url_with_localhost}")
    try:
        u = make_url(url_with_localhost)
        print(f"Parsed: {u}")
        print(f"Host: {u.host}")
        
        # Try creating engine
        engine = create_async_engine(url_with_localhost)
        print("Engine created successfully (Note: Connection not tested, just parsing)")
    except Exception as e:
        print(f"Error: {e}")

    print("-" * 20)

    # Test Case 2: Without localhost (empty host)
    url_without_localhost = "postgresql+asyncpg://user:pass@/dbname?host=/cloudsql/project:region:instance"
    print(f"Testing URL: {url_without_localhost}")
    try:
        u = make_url(url_without_localhost)
        print(f"Parsed: {u}")
        print(f"Host: {u.host}")
        # Try creating engine
        engine = create_async_engine(url_without_localhost)
        print("Engine created successfully")
    except Exception as e:
        print(f"Error: {e}")

    print("-" * 20)

    # Test Case 3: Encoded Host Path (No host query param)
    # Host: /cloudsql/project:region:instance -> %2Fcloudsql%2Fproject%3Aregion%3Ainstance
    url_encoded_host = "postgresql+asyncpg://user:pass@%2Fcloudsql%2Fproject%3Aregion%3Ainstance/dbname"
    print(f"Testing URL: {url_encoded_host}")
    try:
        u = make_url(url_encoded_host)
        print(f"Parsed: {u}")
        print(f"Host: {u.host}")
        print(f"Port: {u.port}")
        
        engine = create_async_engine(url_encoded_host)
        print("Engine created successfully")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
