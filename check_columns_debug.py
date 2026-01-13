
import asyncio
from sqlmodel import text
from app.core.db import engine

async def check():
    async with engine.connect() as conn:
        schema_res = await conn.execute(text("SELECT current_schema(), current_database()"))
        schema, db = schema_res.first()
        print(f"Current DB: {db}, Current Schema: {schema}")
        
        res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'shopify_product_variant'"))
        columns = [row[0] for row in res.all()]
        print(f"Columns in shopify_product_variant: {columns}")
        
        if "inventory_quantity" in columns:
             print("SUCCESS: inventory_quantity found")
             # Try to select it
             res = await conn.execute(text("SELECT inventory_quantity FROM shopify_product_variant LIMIT 1"))
             print(f"Sample value: {res.first()}")
        else:
             print("FAILURE: inventory_quantity NOT found")

if __name__ == "__main__":
    asyncio.run(check())
