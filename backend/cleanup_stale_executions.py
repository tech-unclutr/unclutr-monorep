"""
Cleanup script to mark stale BolnaExecutionMap entries as failed.

This script finds execution map entries that are stuck in active states
(initiated, ringing, connected, speaking) for too long and marks them as failed.
"""

import asyncio
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from datetime import datetime, timedelta
from app.core.db import engine
from app.models.bolna_execution_map import BolnaExecutionMap

# Same timeout constants as in execution.py
INITIATED_TIMEOUT_MINUTES = 5
ACTIVE_CALL_TIMEOUT_MINUTES = 30


async def cleanup_stale_executions():
    """Mark stale execution map entries as failed"""
    
    async with AsyncSession(engine) as session:
        initiated_cutoff = datetime.utcnow() - timedelta(minutes=INITIATED_TIMEOUT_MINUTES)
        active_cutoff = datetime.utcnow() - timedelta(minutes=ACTIVE_CALL_TIMEOUT_MINUTES)
        
        # Find stale initiated calls (>5 min)
        stmt = (
            select(BolnaExecutionMap)
            .where(BolnaExecutionMap.call_status == "initiated")
            .where(BolnaExecutionMap.updated_at < initiated_cutoff)
        )
        result = await session.execute(stmt)
        stale_initiated = result.scalars().all()
        
        # Find stale active calls (>30 min)
        stmt = (
            select(BolnaExecutionMap)
            .where(BolnaExecutionMap.call_status.in_(["ringing", "connected", "speaking"]))
            .where(BolnaExecutionMap.updated_at < active_cutoff)
        )
        result = await session.execute(stmt)
        stale_active = result.scalars().all()
        
        # Mark all as failed
        total_cleaned = 0
        for exec_map in stale_initiated:
            age = datetime.utcnow() - exec_map.updated_at
            print(f"Marking as failed: {exec_map.id} (initiated, age: {age})")
            exec_map.call_status = "failed"
            exec_map.termination_reason = "timeout"
            session.add(exec_map)
            total_cleaned += 1
            
        for exec_map in stale_active:
            age = datetime.utcnow() - exec_map.updated_at
            print(f"Marking as failed: {exec_map.id} ({exec_map.call_status}, age: {age})")
            exec_map.call_status = "failed"
            exec_map.termination_reason = "timeout"
            session.add(exec_map)
            total_cleaned += 1
        
        await session.commit()
        
        print(f"\n✅ Cleaned up {total_cleaned} stale execution map entries")
        print(f"   - {len(stale_initiated)} stale initiated calls")
        print(f"   - {len(stale_active)} stale active calls")
        
        return total_cleaned


if __name__ == "__main__":
    asyncio.run(cleanup_stale_executions())
