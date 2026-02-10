from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

def sanitize_url(db_url: str) -> str:
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    if "postgresql+asyncpg" in db_url:
        parsed_url = urlparse(db_url)
        query_params = parse_qs(parsed_url.query)
        if "sslmode" in query_params:
            sslmode = query_params.pop("sslmode")[0]
            if sslmode == "require":
                query_params["ssl"] = ["require"]
        new_query = urlencode(query_params, doseq=True)
        db_url = urlunparse(parsed_url._replace(query=new_query))
    return db_url

test_cases = [
    ("postgresql://user:pass@host:5432/db", "postgresql+asyncpg://user:pass@host:5432/db"),
    ("postgresql://user:pass@host:5432/db?sslmode=require", "postgresql+asyncpg://user:pass@host:5432/db?ssl=require"),
    ("postgresql://user:pass@host:5432/db?sslmode=disable", "postgresql+asyncpg://user:pass@host:5432/db"),
    ("postgresql+asyncpg://user:pass@host:5432/db?sslmode=require&other=1", "postgresql+asyncpg://user:pass@host:5432/db?other=1&ssl=require"),
    ("sqlite:///sqlite.db", "sqlite:///sqlite.db"),
]

for input_url, expected in test_cases:
    result = sanitize_url(input_url)
    print(f"Input:    {input_url}")
    print(f"Result:   {result}")
    print(f"Expected: {expected}")
    assert result == expected or sorted(result.split('?')) == sorted(expected.split('?'))
    print("PASS")
    print("-" * 20)

print("All tests passed!")
