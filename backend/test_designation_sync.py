"""
Test script to verify designation auto-population from campaigns.
This script checks if a user's designation is automatically populated
from their most recent campaign's team_member_role.
"""

import asyncio
from sqlalchemy import text
from sqlmodel import select
from app.core.db import engine
from app.models.user import User
from app.models.campaign import Campaign

async def test_designation_population():
    """Test that designation is populated from campaigns."""
    from sqlmodel.ext.asyncio.session import AsyncSession
    
    async with AsyncSession(engine) as session:
        # Find a user with campaigns but no designation
        stmt = text("""
            SELECT DISTINCT u.id, u.full_name, u.designation, 
                   c.team_member_role, c.created_at
            FROM "user" u
            JOIN campaigns c ON u.id = c.user_id
            WHERE c.team_member_role IS NOT NULL
            ORDER BY c.created_at DESC
            LIMIT 5
        """)
        
        result = await session.execute(stmt)
        rows = result.fetchall()
        
        print("\n=== Users with Campaigns ===")
        for row in rows:
            user_id, full_name, designation, team_member_role, created_at = row
            print(f"\nUser: {full_name} ({user_id})")
            print(f"  Current Designation: {designation or 'NOT SET'}")
            print(f"  Campaign Role: {team_member_role}")
            print(f"  Campaign Created: {created_at}")
            
            if not designation and team_member_role:
                print(f"  ✓ Should auto-populate designation with: {team_member_role}")
            elif designation == team_member_role:
                print(f"  ✓ Already synced!")
            else:
                print(f"  ⚠ Designation mismatch")

if __name__ == "__main__":
    asyncio.run(test_designation_population())
