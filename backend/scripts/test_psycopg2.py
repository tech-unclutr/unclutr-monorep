import psycopg2

try:
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/postgres")
    print("Success default")
    conn.close()
except Exception as e:
    print(f"Default failed: {e}")

try:
    # Try disabling SSL
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable")
    print("Success with sslmode=disable")
    conn.close()
except Exception as e:
    print(f"SSL Disable failed: {e}")
