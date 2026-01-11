
import asyncio
from sqlalchemy import text
from app.core.db import get_session

async def list_orders():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    print("\n--- Shopify Orders In Database ---\n")
    
    try:
        result = await session.exec(text("SELECT shopify_name, total_price, currency, shopify_created_at FROM shopify_order ORDER BY shopify_created_at DESC"))
        rows = result.all()
        if not rows:
            print("No orders found in shopify_order table.")
        for row in rows:
            print(f"Order: {row[0]} | Amount: {row[1]} {row[2]} | Created: {row[3]}")
            
    except Exception as e:
        print(f"Error: {e}")
            
    await session.close()

if __name__ == "__main__":
    asyncio.run(list_orders())
