
import asyncio
from sqlalchemy.engine.url import make_url
from sqlalchemy.dialects.postgresql.asyncpg import PGDialect_asyncpg

def test_url_parsing():
    # The URL we are currently using
    url_str = "postgresql+asyncpg://user:pass@/postgres?host=/cloudsql/unclutr-monorep:asia-south1:unclutr-db-india"
    url = make_url(url_str)
    
    print(f"URL: {url}")
    print(f"Host: {url.host}")
    print(f"Port: {url.port}")
    print(f"Database: {url.database}")
    print(f"Query: {url.query}")
    
    dialect = PGDialect_asyncpg()
    # PGDialect_asyncpg doesn't have create_connect_args exposed easily as a public method that returns dict clearly
    # But we can inspect url.translate_connect_args()
    
    args = url.translate_connect_args(username="user", password="password", database="database", host="host")
    print(f"Translate Args: {args}")
    
    # Check what happens if we add localhost
    url_localhost = make_url("postgresql+asyncpg://user:pass@localhost/postgres?host=/cloudsql/unclutr-monorep:asia-south1:unclutr-db-india")
    print("\nWith localhost:")
    print(f"Host: {url_localhost.host}")
    args_localhost = url_localhost.translate_connect_args(username="user", password="password", database="database", host="host")
    print(f"Translate Args: {args_localhost}")

if __name__ == "__main__":
    test_url_parsing()
