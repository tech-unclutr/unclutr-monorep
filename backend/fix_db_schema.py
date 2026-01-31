import sqlite3
import os

DB_PATH = "unclutr.db"

def add_columns():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(user)")
        columns = [info[1] for info in cursor.fetchall()]

        if "designation" not in columns:
            print("Adding designation column...")
            cursor.execute("ALTER TABLE user ADD COLUMN designation VARCHAR")
        else:
            print("Designation column already exists.")

        if "team" not in columns:
            print("Adding team column...")
            cursor.execute("ALTER TABLE user ADD COLUMN team VARCHAR")
        else:
            print("Team column already exists.")
            
        if "current_company_id" not in columns:
            print("Adding current_company_id column...")
            cursor.execute("ALTER TABLE user ADD COLUMN current_company_id VARCHAR") # UUID as string
        else:
            print("current_company_id column already exists.")

        if "contact_number" not in columns:
            print("Adding contact_number column...")
            cursor.execute("ALTER TABLE user ADD COLUMN contact_number VARCHAR")
        else:
            print("contact_number column already exists.")

        if "otp_verified" not in columns:
            print("Adding otp_verified column...")
            cursor.execute("ALTER TABLE user ADD COLUMN otp_verified BOOLEAN DEFAULT 0")
        else:
            print("otp_verified column already exists.")

        if "settings" not in columns:
            print("Adding settings column...")
            cursor.execute("ALTER TABLE user ADD COLUMN settings TEXT") # JSONB as TEXT
        else:
            print("settings column already exists.")

        conn.commit()
        print("Database schema updated successfully.")

    except Exception as e:
        print(f"Error updating database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_columns()
