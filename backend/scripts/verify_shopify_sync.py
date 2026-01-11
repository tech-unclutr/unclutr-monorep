
import asyncio
from sqlalchemy import text
from app.core.db import get_session

async def verify_shopify_sync():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    queries = {
        "Shopify Orders": "SELECT count(*) FROM shopify_order",
        "Shopify Line Items": "SELECT count(*) FROM shopify_line_item",
        "Shopify Raw Ingest": "SELECT count(*) FROM shopify_raw_ingest",
        "Integrations": "SELECT count(*), status, last_sync_at FROM integration WHERE datasource_id = (SELECT id FROM data_source WHERE slug = 'shopify') GROUP BY status, last_sync_at",
    }
    
    print("\n--- Shopify Sync Verification ---\n")
    
    for label, query in queries.items():
        try:
            result = await session.exec(text(query))
            row = result.first()
            if row:
                if label == "Integrations":
                    print(f"{label}: {row[0]} records, Status: {row[1]}, Last Synced: {row[2]}")
                else:
                    print(f"{label}: {row[0]}")
            else:
                print(f"{label}: No records found")
        except Exception as e:
            print(f"{label}: Error {e}")
            
    await session.close()

if __name__ == "__main__":
    asyncio.run(verify_shopify_sync())
