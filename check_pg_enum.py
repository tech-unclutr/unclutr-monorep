import asyncio
from sqlalchemy import text
from app.core.db import engine

async def check_type():
    async with engine.connect() as conn:
        try:
            res = await conn.execute(text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'integrationstatus'"))
            rows = res.all()
            print("Postgres Enum 'integrationstatus' labels:")
            for r in rows:
                print(f"- {r.enumlabel}")
        except Exception as e:
            print(f"Error or type not found: {e}")

if __name__ == "__main__":
    asyncio.run(check_type())
