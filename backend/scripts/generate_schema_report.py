import sqlite3
import os

DB_PATH = "unclutr.db"
OUTPUT_FILE = "/Users/param/.gemini/antigravity/brain/5032061d-aef0-4f5c-8084-49581d3511f9/database_schema.md"

def generate_report():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cursor.fetchall() if r[0] != "sqlite_sequence"]

    with open(OUTPUT_FILE, "w") as f:
        f.write("# 🗄️ Unclutr Database Schema\n\n")
        f.write(f"**Database**: `{DB_PATH}`\n")
        f.write(f"**Table Count**: {len(tables)}\n\n")

        for table in sorted(tables):
            cursor.execute(f"PRAGMA table_info({table})")
            columns = cursor.fetchall()
            
            # Count rows
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            row_count = cursor.fetchone()[0]

            f.write(f"## 📄 {table}\n")
            f.write(f"> **Rows**: {row_count}\n\n")
            f.write("| CID | Name | Type | Key | Default |\n")
            f.write("| :--- | :--- | :--- | :--- | :--- |\n")
            
            for col in columns:
                cid, name, dtype, notnull, dflt, pk = col
                pk_str = "🔑 PK" if pk else ""
                dflt_str = f"`{dflt}`" if dflt is not None else ""
                f.write(f"| {cid} | **{name}** | `{dtype}` | {pk_str} | {dflt_str} |\n")
            
            f.write("\n---\n")

    conn.close()
    print(f"Schema report generated at {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_report()
