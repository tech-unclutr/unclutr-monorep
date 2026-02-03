import asyncio
import os
import sys
import re

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.core.db import get_session

async def restore_data_only():
    """
    Restores data from backend/stable_db_dump.sql without modifying the schema.
    1. Truncates all tables.
    2. Parses stable_db_dump.sql for COPY statements and sequence resets.
    3. Executes the statements.
    """
    print("🚀 STARTING DATA-ONLY RESTORATION...")
    print("-" * 60)

    # 1. Locate Dump File
    dump_path = os.path.join(os.path.dirname(__file__), '..', 'stable_db_dump.sql')
    dump_path = os.path.abspath(dump_path)

    if not os.path.exists(dump_path):
        print(f"❌ No stable dump found at {dump_path}.")
        print("Run 'python backend/scripts/mark_stable.py' first.")
        sys.exit(1)

    print(f"📖 Reading dump file: {dump_path}")
    
    # 2. Parse Dump File
    copy_commands = []
    setval_commands = []
    
    current_copy_cmd = None
    copy_lines = []
    
    try:
        with open(dump_path, 'r', encoding='utf-8') as f:
            for line in f:
                # Handle COPY block
                if line.startswith("COPY "):
                    current_copy_cmd = line.strip()
                    copy_lines = []
                    continue
                
                if current_copy_cmd:
                    if line.strip() == "\.":
                        # End of COPY block
                        full_copy_cmd = current_copy_cmd + "\n" + "".join(copy_lines) + "\\."
                        copy_commands.append((current_copy_cmd, "".join(copy_lines))) # Store header and data separately if needed, or just full block
                        current_copy_cmd = None
                        copy_lines = []
                    else:
                        copy_lines.append(line)
                    continue

                # Handle Sequence Reset
                if "SELECT pg_catalog.setval" in line:
                    setval_commands.append(line.strip())

    except Exception as e:
        print(f"❌ Failed to parse dump file: {e}")
        sys.exit(1)

    print(f"found {len(copy_commands)} COPY commands and {len(setval_commands)} setval commands.")

    # 3. Connect to DB and Execute
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    try:
        # A. Truncate All Tables
        # We need to find all tables first to truncate them safely (CASCADE)
        print("\n🗑️  Truncating all tables...")
        
        # Get all table names in public schema
        result = await session.exec(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
        tables = result.all()
        
        if not tables:
            print("⚠️  No tables found to truncate.")
        else:
            for table in tables:
                t_name = table[0]
                if t_name == "alembic_version": # Skip alembic table
                    continue
                # Use CASCADE to handle foreign keys
                # Quote table name to handle reserved words like "user"
                await session.exec(text(f'TRUNCATE TABLE "{t_name}" CASCADE'))
        
        # Commit truncation
        await session.commit()
        print("✅ All tables truncated.")

        # B. Execute COPY commands
        print("\n📥 Importing data...")
        
        # We can't easily use session.exec for COPY with raw data inline in asyncpg/sqlalchemy easily without raw connection
        # But 'COPY ... FROM stdin' requires using the raw cursor's copy_expert or specific driver methods.
        # SQLAlchemy's async session might abstract this.
        # Strategy: Use the underlying asyncpg connection for COPY.
        
        # Access the raw connection
        # This part depends on the driver. Assuming asyncpg.
        # session.connection() -> engine connection
        
        # Alternatively, since we have the data strings, we can just use psycopg2/asyncpg copy_records_to_table 
        # but parsing the SQL dump format (tab separated, nulls, etc) exactly matches postgres COPY from stdin.
        
        # Let's try to get the raw asyncpg connection from the session
        # The session is SQLModel (wrapper around AsyncSession). 
        # session.connection() returns a SQLAlchemy AsyncConnection.
        # conn.driver_connection returns the actual asyncpg connection (if dealing with asyncpg).
        
        # Let's assume standard asyncpg access
        from sqlalchemy.ext.asyncio import AsyncSession
        
        # We need to commit/close the session before doing raw operations potentially, or just use the session's transaction.
        
        # Re-using the logic from mark_stable/revert_stable which uses subprocess psql might be SAFER and EASIER for COPY
        # IF we can pipe just the relevant parts. 
        # But constructing a temporary file with just the data cmds is better?
        
        # Let's create a temporary SQL file with just the TRUNCATE (done) and COPY/setval logic?
        # No, we already truncated.
        # We can generate a temp sql file with just the COPY blocks and run it via psql. 
        # This avoids driver complexity with parsing COPY format.
        
        temp_sql_path = os.path.join(os.path.dirname(dump_path), 'temp_restore_data.sql')
        
        with open(temp_sql_path, 'w', encoding='utf-8') as tf:
            tf.write("BEGIN;\n")
            # Disable foreign key checks for this transaction (requires superuser typically)
            tf.write("SET session_replication_role = replica;\n")
            
            # Get list of existing tables to filter COPY commands
            # We already have 'tables' variable from the truncate step, but need to be sure.
            # Convert to set for lookup
            existing_tables = set(t[0] for t in tables)
            
            # Write COPY commands
            for header, body in copy_commands:
                # header looks like: COPY public.tablename (col1, col2) FROM stdin;
                # Extract tablename
                import re
                match = re.search(r"COPY public\.([a-zA-Z0-9_]+)", header)
                if match:
                    t_name = match.group(1)
                    
                    # 1. Check direct existence
                    if t_name not in existing_tables:
                        # 2. Check pluralization mapping (often needed for older dumps)
                        plural_name = t_name + "s"
                        if plural_name in existing_tables:
                            print(f"⚠️  Mapping table: {t_name} -> {plural_name}")
                            header = header.replace(f"COPY public.{t_name} ", f"COPY public.{plural_name} ")
                        else:
                            # 3. Skip if neither exists
                            print(f"⚠️  Skipping restore for missing table: {t_name}")
                            continue

                tf.write(f"{header}\n{body}\\.\n")
            
            # Write setval commands
            for cmd in setval_commands:
                mapped_cmd = cmd
                if "pg_catalog.setval('public.interview_session_id_seq'" in cmd:
                    mapped_cmd = cmd.replace("pg_catalog.setval('public.interview_session_id_seq'", "pg_catalog.setval('public.interview_sessions_id_seq'")
                tf.write(f"{mapped_cmd}\n")
            
            tf.write("COMMIT;\n")

        print(f"📝 Created temporary restore file at {temp_sql_path}")
        
        # Execute via psql
        from app.core.config import settings
        db_url = settings.DATABASE_URL
        if "+asyncpg" in db_url:
            clean_db_url = db_url.replace("+asyncpg", "")
        elif "+psycopg2" in db_url:
             clean_db_url = db_url.replace("+psycopg2", "")
        else:
            clean_db_url = db_url

        import subprocess
        print("▶️  Executing data restore via psql...")
        cmd = ["psql", "-d", clean_db_url, "-f", temp_sql_path, "-v", "ON_ERROR_STOP=1"]
        subprocess.run(cmd, check=True)
        
        print("✅ Data import successful.")
        
        # Cleanup temp file
        os.remove(temp_sql_path)
        print("🧹 Cleaned up temporary file.")

    except Exception as e:
        print(f"❌ Error during restoration: {e}")
        # If we failed, we might have an empty DB. 
        print("⚠️  Warning: Database might be in inconsistent state.")
        sys.exit(1)
    finally:
        await session.close()

    print("-" * 60)
    print("✅ DATA-ONLY RESTORE COMPLETED")
    print("-" * 60)

if __name__ == "__main__":
    asyncio.run(restore_data_only())
