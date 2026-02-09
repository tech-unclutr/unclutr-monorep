"""
Verification script for lead closure after outcome logging.

This script checks:
1. Leads with logged outcomes have status = CLOSED
2. Rescheduled leads have status = RESCHEDULED
3. retry_scheduled_for is set for rescheduled leads
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.core.db import async_session_factory
from app.models.user_queue_item import UserQueueItem
from app.models.user_call_log import UserCallLog
from datetime import datetime, timedelta

async def verify_lead_closure():
    print("=== Lead Closure Verification ===\n")
    
    async with async_session_factory() as session:
        # 1. Check for recently closed leads
        print("1. Checking recently closed leads...")
        closed_stmt = select(UserQueueItem).where(
            UserQueueItem.status == "CLOSED"
        ).order_by(UserQueueItem.updated_at.desc()).limit(10)
        
        closed_result = await session.execute(closed_stmt)
        closed_items = closed_result.scalars().all()
        
        print(f"   Found {len(closed_items)} closed leads:")
        for item in closed_items:
            print(f"   - Lead ID: {item.lead_id}, Closure Reason: {item.closure_reason}, Closed At: {item.closed_at}")
        
        # 2. Check for rescheduled leads
        print("\n2. Checking rescheduled leads...")
        rescheduled_stmt = select(UserQueueItem).where(
            UserQueueItem.status == "RESCHEDULED"
        ).order_by(UserQueueItem.updated_at.desc()).limit(10)
        
        rescheduled_result = await session.execute(rescheduled_stmt)
        rescheduled_items = rescheduled_result.scalars().all()
        
        print(f"   Found {len(rescheduled_items)} rescheduled leads:")
        for item in rescheduled_items:
            scheduled_time = item.retry_scheduled_for.isoformat() if item.retry_scheduled_for else "NOT SET"
            print(f"   - Lead ID: {item.lead_id}, Scheduled For: {scheduled_time}")
        
        # 3. Check recent call logs
        print("\n3. Checking recent user call logs...")
        logs_stmt = select(UserCallLog).order_by(UserCallLog.created_at.desc()).limit(10)
        
        logs_result = await session.execute(logs_stmt)
        logs = logs_result.scalars().all()
        
        print(f"   Found {len(logs)} recent call logs:")
        for log in logs:
            print(f"   - Lead ID: {log.lead_id}, Status: {log.status}, Next Action: {log.next_action}, Created: {log.created_at}")
        
        # 4. Verify data consistency
        print("\n4. Verifying data consistency...")
        
        # Check for leads that should be closed but aren't
        recent_time = datetime.utcnow() - timedelta(hours=1)
        
        # Get all call logs from the last hour
        recent_logs_stmt = select(UserCallLog).where(
            UserCallLog.created_at >= recent_time
        )
        recent_logs_result = await session.execute(recent_logs_stmt)
        recent_logs = recent_logs_result.scalars().all()
        
        issues = []
        for log in recent_logs:
            # Get the corresponding user queue item
            item_stmt = select(UserQueueItem).where(
                UserQueueItem.id == log.user_queue_item_id
            )
            item_result = await session.execute(item_stmt)
            item = item_result.scalar_one_or_none()
            
            if item:
                # Check if the status matches expectations
                if log.next_action == "RETRY_SCHEDULED":
                    if item.status != "RESCHEDULED":
                        issues.append(f"   ⚠️  Lead {item.lead_id}: Expected RESCHEDULED, got {item.status}")
                    if not item.retry_scheduled_for:
                        issues.append(f"   ⚠️  Lead {item.lead_id}: RESCHEDULED but no retry_scheduled_for set")
                elif log.next_action in ["CLOSE_WON", "CLOSE_LOST"]:
                    if item.status != "CLOSED":
                        issues.append(f"   ⚠️  Lead {item.lead_id}: Expected CLOSED, got {item.status}")
                elif log.next_action is None or log.next_action == "":
                    # Default behavior: should be closed
                    if item.status != "CLOSED":
                        issues.append(f"   ⚠️  Lead {item.lead_id}: Expected CLOSED (default), got {item.status}")
        
        if issues:
            print("   Found issues:")
            for issue in issues:
                print(issue)
        else:
            print("   ✅ All data is consistent!")
        
        print("\n=== Verification Complete ===")

if __name__ == "__main__":
    asyncio.run(verify_lead_closure())
