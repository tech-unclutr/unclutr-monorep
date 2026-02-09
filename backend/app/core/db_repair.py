import logging

from sqlalchemy import text

logger = logging.getLogger(__name__)

async def get_foreign_key_constraints(conn, column_name, target_table):
    """
    Scans the database for all tables that have a specific column 
    referencing a target table.
    """
    query = f"""
    SELECT
        tc.table_name, 
        tc.constraint_name
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND kcu.column_name = '{column_name}'
      AND ccu.table_name = '{target_table}';
    """
    result = await conn.execute(text(query))
    return result.all()

async def ensure_column_exists(conn, table_name, column_name, column_type, default_value=None):
    """
    Checks if a column exists in a table and adds it if not.
    """
    # Systemic Fix: Check if table even exists first
    table_exists_query = f"""
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = '{table_name}';
    """
    table_exists = (await conn.execute(text(table_exists_query))).first()
    if not table_exists:
        logger.warning(f"Skipping column check: Table {table_name} does not exist.")
        return

    check_query = f"""
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = '{table_name}' AND column_name = '{column_name}';
    """
    res = await conn.execute(text(check_query))
    if not res.first():
        logger.info(f"Adding missing column {column_name} ({column_type}) to {table_name}...")
        alter_query = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
        if default_value is not None:
            alter_query += f" DEFAULT {default_value}"
        await conn.execute(text(alter_query))
        logger.info(f"Successfully added {column_name} to {table_name}.")

async def heal_integration_constraints(engine):
    """
    Main entry point for database healing.
    1. integration_id -> integration(id)
    2. order_id -> shopify_order(id)
    3. Missing columns (inventory_quantity, etc)
    """
    logger.info("Scanning for foreign key constraints to heal...")
    # Check if we are on Postgres
    if not engine.url.drivername.startswith("postgresql"):
        logger.warning("Healing skip: Not a PostgreSQL database.")
        return

    # --- 1. Schema Hardening (Columns) ---
    try:
        async with engine.begin() as conn:
            await ensure_column_exists(conn, 'shopify_product_variant', 'inventory_quantity', 'INTEGER', '0')
            # Add missing campaign cohort columns
            await ensure_column_exists(conn, 'campaigns', 'cohort_questions', 'JSONB', "'{}'")
            await ensure_column_exists(conn, 'campaigns', 'cohort_incentives', 'JSONB', "'{}'")
            
            # --- 1b. Data Normalization (Enums) ---
            # Fixes case-sensitivity issues with SQLAlchemy IntegrationStatus Enum
            await conn.execute(text("""
                UPDATE integration 
                SET status = UPPER(status) 
                WHERE status != UPPER(status)
            """))
    except Exception as e:
        logger.error(f"Failed to ensure schema consistency: {e}")

    # --- 2. Foreign Key Cascades ---
    try:
        async with engine.begin() as conn:
            # 1. Integration ID Cascades
            integ_constraints = await get_foreign_key_constraints(conn, 'integration_id', 'integration')
            
            # 2. Shopify Order ID Cascades
            order_constraints = await get_foreign_key_constraints(conn, 'order_id', 'shopify_order')
            
            all_constraints = []
            for t, c in integ_constraints: all_constraints.append((t, c, 'integration_id', 'integration(id)'))
            for t, c in order_constraints: all_constraints.append((t, c, 'order_id', 'shopify_order(id)'))

            if not all_constraints:
                logger.info("No foreign key constraints found to heal.")
                return

            for table, constraint, column, reference in all_constraints:
                try:
                    # Check if it already has CASCADE (Postgres specific check)
                    check_query = f"""
                    SELECT confdeltype 
                    FROM pg_constraint 
                    WHERE conname = '{constraint}';
                    """
                    res = await conn.execute(text(check_query))
                    row = res.first()
                    if row and row[0] == 'c':
                        # 'c' means CASCADE
                        continue

                    logger.info(f"Repairing constraint {constraint} on {table} to ON DELETE CASCADE...")
                    
                    # 1. Drop existing constraint
                    await conn.execute(text(f"ALTER TABLE {table} DROP CONSTRAINT {constraint}"))
                    
                    # 2. Add it back with ON DELETE CASCADE
                    await conn.execute(text(
                        f"ALTER TABLE {table} ADD CONSTRAINT {constraint} "
                        f"FOREIGN KEY ({column}) REFERENCES {reference} ON DELETE CASCADE"
                    ))
                    logger.info(f"Successfully healed {table}.{constraint}")
                    
                except Exception as e:
                    logger.error(f"Failed to heal constraint {constraint} on {table}: {e}")
                    # Continue with next constraint instead of failing entire operation
                    continue
    except Exception as e:
        logger.error(f"Failed to scan/heal foreign key constraints: {e}")
