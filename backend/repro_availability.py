
import asyncio
import os
import sys
from uuid import UUID
from sqlalchemy import select
from datetime import datetime, timezone

# Add backend directory to sys.path
backend_path = os.path.join(os.getcwd(), 'backend')
sys.path.append(backend_path)

from app.core.db import get_session
from app.models.calendar_connection import CalendarConnection
from app.services.intelligence.google_calendar_service import google_calendar_service

async def main():
    print("--- DEBUG: Starting Calendar Availability Diagnostic ---")
    
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    try:
        # 1. Fetch All Active Calendar Connections
        stmt = select(CalendarConnection).where(CalendarConnection.status == 'active').order_by(CalendarConnection.updated_at.desc())
        res = await session.execute(stmt)
        connections = res.scalars().all()
        
        if not connections:
            print("CRITICAL: No active calendar connections found in DB.")
            return

        print(f"Found {len(connections)} active connections.")

        for conn in connections:
            print(f"\n--- Testing Connection: {conn.id} ---")
            print(f"Company ID: {conn.company_id}")
            print(f"User ID: {conn.user_id}")
            
            try:
                busy_slots = await google_calendar_service.get_availability(conn)
                print(f"SUCCESS: Found {len(busy_slots)} busy slots.")
                if busy_slots:
                    print(f"  First slot: {busy_slots[0]['start']} to {busy_slots[0]['end']}")
            except Exception as e:
                print(f"ERROR: {e}")

    except Exception as e:
        print(f"Unexpected Error: {e}")
    finally:
        await session.close()
        print("\n--- DEBUG: Finished ---")

if __name__ == "__main__":
    asyncio.run(main())
