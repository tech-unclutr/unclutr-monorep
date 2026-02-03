import asyncio
import sys
import os
from sqlalchemy import text

# Add app to path
sys.path.append(os.getcwd())

from app.core.db import get_session

async def check_table_counts():
    session_gen = get_session()
    session = await session_gen.__anext__()
    try:
        tables = ["integration", "data_source", "user", "company", "campaigns"]
        for t in tables:
            try:
                # Handle pluralization mismatch if necessary, but try singular first matching model
                # SQL table names are usually plural in this codebase?
                # Check model definitions:
                # Integration -> integration (singular in model? let's query pg_tables to be sure)
                
                # Dynamic check
                result = await session.execute(text(f"SELECT count(*) FROM \"{t}\""))
                count = result.scalar()
                print(f"✅ {t}: {count} rows")
            except Exception as e:
                # Try plural
                try:
                    t_plural = t + "s"
                    result = await session.execute(text(f"SELECT count(*) FROM \"{t_plural}\""))
                    count = result.scalar()
                    print(f"✅ {t_plural}: {count} rows")
                except:
                    print(f"❌ {t}: Error query/Does not exist")

    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        await session.close()
        try:
            await session_gen.aclose()
        except:
            pass

if __name__ == "__main__":
    asyncio.run(check_table_counts())
