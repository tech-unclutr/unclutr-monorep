"""
Script to fetch the last 2 Bolna raw data payloads
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import engine
from app.models.call_raw_data import CallRawData
import json

async def get_raw_data():
    async with AsyncSession(engine) as session:
        stmt = select(CallRawData).order_by(CallRawData.created_at.desc()).limit(2)
        result = await session.execute(stmt)
        raw_data_entries = result.scalars().all()
        
        for i, entry in enumerate(raw_data_entries, 1):
            print(f'\n{"="*80}')
            print(f'RAW DATA SAMPLE {i}')
            print(f'{"="*80}')
            print(f'Campaign ID: {entry.campaign_id}')
            print(f'Bolna Call ID: {entry.bolna_call_id}')
            print(f'Created At: {entry.created_at}')
            print(f'\nPAYLOAD:')
            print(json.dumps(entry.payload, indent=2))
            
asyncio.run(get_raw_data())
