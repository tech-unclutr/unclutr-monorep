from datetime import datetime
import re
from typing import Optional

def _inject_range_into_shopify_ql(query: str, start_date: Optional[datetime], end_date: Optional[datetime]) -> str:
    # 1. Prepare snippets
    since_val = start_date.strftime('%Y-%m-%d') if start_date else None
    until_val = end_date.strftime('%Y-%m-%d') if end_date else None
    
    if not since_val and not until_val:
        return query

    # 2. Add snippets to list
    clauses = []
    if since_val: clauses.append(f"SINCE {since_val}")
    if until_val: clauses.append(f"UNTIL {until_val}")
    injection = " " + " ".join(clauses)

    # 3. Use Regex to find the FROM table_name pattern
    # Pattern: FROM <table_name>
    pattern = re.compile(r'(FROM\s+[a-zA-Z0-9_]+)', re.IGNORECASE)
    
    if pattern.search(query):
        # Insert right after the table name
        return pattern.sub(rf'\1{injection}', query)
    
    return f"{query}{injection}"

# Test Cases
start = datetime(2025, 12, 1)
end = datetime(2025, 12, 31)

test_queries = [
    "SELECT total_sales FROM sales",
    "SELECT count(*) FROM orders GROUP BY day",
    "SELECT name FROM customers WHERE country = 'USA'",
    "SHOW TABLES", # Missing FROM
    "select total_sales from sales group by month", # Case insensitive
]

print("🧪 Running ShopifyQL Injection Tests...")
for q in test_queries:
    injected = _inject_range_into_shopify_ql(q, start, end)
    print(f"\nOriginal: {q}")
    print(f"Injected: {injected}")
    
    if "FROM" in q.upper():
        assert "SINCE 2025-12-01" in injected
        assert "UNTIL 2025-12-31" in injected
        # Check placement: SINCE should be after the table name
        table_match = re.search(r'FROM\s+([a-zA-Z0-9_]+)', injected, re.I)
        if table_match:
            table_pos = injected.find(table_match.group(1))
            since_pos = injected.find("SINCE")
            assert since_pos > table_pos
    else:
        assert injected.endswith("SINCE 2025-12-01 UNTIL 2025-12-31")

print("\n✅ All injection tests passed!")
