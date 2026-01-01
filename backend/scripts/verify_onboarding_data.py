import sqlite3
import json
import os
from datetime import datetime

# Script to verify that Onboarding Data is correctly saved in the SQLite DB
# Run from backend directory: python scripts/verify_onboarding_data.py

DB_PATH = "unclutr.db"

def verify_data():
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print(f"\n🔍 Inspecting 'onboardingstate' table in {DB_PATH}...\n")

    try:
        # Get the most recently updated onboarding state
        cursor.execute("""
            SELECT user_id, current_page, is_completed, 
                   basics_data, channels_data, stack_data, 
                   created_by, last_saved_at
            FROM onboardingstate 
            ORDER BY last_saved_at DESC 
            LIMIT 1
        """)
        row = cursor.fetchone()

        if not row:
            print("⚠️ No onboarding data found in database.")
            return

        print(f"👤 User ID: {row['user_id']}")
        print(f"📄 Current Page: {row['current_page']}")
        print(f"✅ Completed: {row['is_completed']}")
        print(f"🕒 Last Saved: {row['last_saved_at']}")
        print(f"🔒 Created By (Imprint): {row['created_by']}")
        print("-" * 50)
        
        print("\n📦 BASICS DATA:")
        print(row['basics_data'] if row['basics_data'] else "   (Empty)")

        print("\n📦 CHANNELS DATA:")
        print(row['channels_data'] if row['channels_data'] else "   (Empty)")

        print("\n📦 STACK DATA:")
        print(row['stack_data'] if row['stack_data'] else "   (Empty)")

        print("-" * 50)
        print("\n✅ VERIFICATION COMPLETE")
        print("If you see your data above, the Frontend -> Backend connection is working correctly.")

    except Exception as e:
        print(f"❌ Error reading database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    verify_data()
