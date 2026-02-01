
import asyncio
from sqlalchemy import text, inspect
from app.core.db import engine

async def inspect_campaigns_table():
    async with engine.connect() as conn:
        def get_columns(connection):
            inspector = inspect(connection)
            return inspector.get_columns('campaigns')
        
        columns = await conn.run_sync(get_columns)
        print("Columns in 'campaigns' table:")
        column_names = []
        for column in columns:
            print(f"- {column['name']} ({column['type']})")
            column_names.append(column['name'])
        
        return column_names

if __name__ == "__main__":
    asyncio.run(inspect_campaigns_table())
