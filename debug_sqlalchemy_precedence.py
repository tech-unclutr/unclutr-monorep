
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test_connect_args_precedence():
    # URL has localhost (implies TCP)
    url = "postgresql+asyncpg://user:pass@localhost/postgres"
    
    # connect_args has Unix socket path (implies Socket)
    # Use a dummy path that definitely doesn't exist contextually but checks if it tries to use it
    # But asyncpg requires the socket to fail with FileNotFoundError to prove it tried socket
    # If it tries TCP, it fails with ConnectionRefusedError usually
    
    fake_socket = "/tmp/fake.sock"
    
    # We can't easily spy on asyncpg without mocking, but we can infer from the error
    
    # However, we can use the PGDialect_asyncpg to see what args it constructs?
    from sqlalchemy.dialects.postgresql.asyncpg import PGDialect_asyncpg
    dialect = PGDialect_asyncpg()
    
    # Simulate create_connect_args
    # SQLAlchemy 1.4+
    from sqlalchemy.engine.url import make_url
    u = make_url(url)
    
    # "connect_args" are passed to create_async_engine and eventually dialect.connect()
    # But dialect.create_connect_args(url) extracts args from URL
    # Then merged with connect_args?
    
    c_args = dialect.create_connect_args(u)
    print(f"Dialect args from URL: {c_args}")
    # c_args is (dsn_list, connect_args)
    
    # If we pass extra connect_args via engine_kwargs
    user_connect_args = {"host": "/tmp/socket"}
    
    # Explicitly merging:
    final_args = c_args[1].copy()
    final_args.update(user_connect_args)
    
    print(f"Final args passed to asyncpg.connect: {final_args}")
    print(f"Effective Host: {final_args.get('host')}")

if __name__ == "__main__":
    asyncio.run(test_connect_args_precedence())
