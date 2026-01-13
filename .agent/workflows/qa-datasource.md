---
description: Run comprehensive QA verification for any data source integration
---

# Data Source Integration QA Blueprint Workflow

This workflow ensures **100% accurate 1-to-1 real-time synchronization** for any data source integration (Shopify, Stripe, QuickBooks, etc.).

## Prerequisites

- [ ] Data source integration code completed
- [ ] OAuth/API credentials configured
- [ ] Database migrations run
- [ ] Initial sync completed

## Phase 1: Configuration Verification (15 min)

### 1.1 OAuth Scopes Audit

```bash
# Review the OAuth scopes
cat backend/app/services/{datasource}/oauth_service.py | grep -A 20 "SCOPES ="
```

**Checklist:**
- [ ] All required scopes listed
- [ ] Scopes match data types being synced
- [ ] Scopes documented with comments

### 1.2 Database Schema Check

```bash
# List all tables for this data source
cd backend
source venv/bin/activate
python -c "
from app.core.db import async_session_factory
from sqlalchemy import inspect, text
import asyncio

async def list_tables():
    async with async_session_factory() as session:
        result = await session.execute(text(\"SELECT tablename FROM pg_tables WHERE tablename LIKE '{datasource}_%' ORDER BY tablename\"))
        tables = result.scalars().all()
        print(f'Found {len(tables)} tables:')
        for table in tables:
            print(f'  ✅ {table}')

asyncio.run(list_tables())
"
```

**Required Tables:**
- [ ] `{datasource}_raw_ingest` exists
- [ ] All core object tables exist
- [ ] All sub-object tables exist

## Phase 2: Sync Function Coverage (20 min)

### 2.1 List All Sync Functions

```bash
# Find all fetch_and_ingest functions
grep -n "async def fetch_and_ingest" backend/app/services/{datasource}/sync_service.py
```

**Checklist:**
- [ ] Every data type has a sync function
- [ ] Pagination implemented
- [ ] Rate limit handling present
- [ ] Error handling and logging

### 2.2 Test Sync Functions

// turbo
```bash
# Run a test sync for each data type
cd backend
source venv/bin/activate
python scripts/test_{datasource}_sync.py
```

## Phase 3: Webhook Coverage (15 min)

### 3.1 Verify Webhook Registration

```bash
# Check webhook topics
grep -A 50 "topics = \[" backend/app/services/{datasource}/oauth_service.py
```

**Checklist:**
- [ ] All CRUD events covered (create, update, delete)
- [ ] Webhook URLs correct
- [ ] HMAC verification implemented

### 3.2 Check Webhook Status

```bash
# Query integration metadata for webhook status
cd backend
source venv/bin/activate
python -c "
from app.core.db import async_session_factory
from app.models.integration import Integration
from sqlalchemy import select
import asyncio
import json

async def check_webhooks():
    async with async_session_factory() as session:
        result = await session.execute(
            select(Integration).where(Integration.metadata_info['shop'].astext.isnot(None)).limit(1)
        )
        integration = result.scalars().first()
        if integration:
            webhook_info = integration.metadata_info.get('webhook_registration', {})
            print(f'Webhook Status: {webhook_info.get(\"status\")}')
            print(f'Success Rate: {webhook_info.get(\"success_rate\")}%')
            print(f'Registered: {webhook_info.get(\"success_count\")} webhooks')
            if webhook_info.get('failures'):
                print(f'⚠️  Failed: {len(webhook_info[\"failures\"])} webhooks')

asyncio.run(check_webhooks())
"
```

## Phase 4: Deduplication Verification (10 min)

### 4.1 Check for Duplicate Canonical Hashes

```bash
cd backend
source venv/bin/activate
python -c "
from app.core.db import async_session_factory
from sqlalchemy import text
import asyncio

async def check_duplicates():
    async with async_session_factory() as session:
        result = await session.execute(text('''
            SELECT dedupe_hash_canonical, COUNT(*) as count
            FROM {datasource}_raw_ingest
            GROUP BY dedupe_hash_canonical
            HAVING COUNT(*) > 1
        '''))
        duplicates = result.all()
        if duplicates:
            print(f'❌ Found {len(duplicates)} duplicate hashes!')
            for dup in duplicates[:5]:
                print(f'   Hash: {dup[0][:16]}... Count: {dup[1]}')
        else:
            print('✅ All canonical hashes are unique')

asyncio.run(check_duplicates())
"
```

**Expected:** 0 duplicate hashes

### 4.2 Verify Object Update Tracking

```bash
cd backend
source venv/bin/activate
python -c "
from app.core.db import async_session_factory
from sqlalchemy import text
import asyncio

async def check_updates():
    async with async_session_factory() as session:
        result = await session.execute(text('''
            SELECT object_type, {datasource}_object_id, COUNT(*) as count
            FROM {datasource}_raw_ingest
            WHERE {datasource}_object_id IS NOT NULL
            GROUP BY object_type, {datasource}_object_id
            HAVING COUNT(*) > 1
            ORDER BY count DESC
            LIMIT 10
        '''))
        updates = result.all()
        if updates:
            print(f'✅ Found {len(updates)} objects with updates (expected):')
            for obj in updates:
                print(f'   {obj[0]} ID {obj[1]}: {obj[2]} records')
        else:
            print('ℹ️  No updated objects found (all unique)')

asyncio.run(check_updates())
"
```

**Expected:** Multiple raw records for updated objects (this is correct!)

## Phase 5: Data Accuracy Verification (30 min)

### 5.1 Create Verification Script

**If not exists**, create `backend/scripts/verify_{datasource}_integrity.py`:

```bash
# Copy template from Shopify verification
cp backend/scripts/verify_shopify_integrity.py backend/scripts/verify_{datasource}_integrity.py

# Update data source name and models
# Edit the file to match your data source
```

### 5.2 Run Verification Script

// turbo
```bash
cd backend
source venv/bin/activate
python scripts/verify_{datasource}_integrity.py
```

**Expected Output:**
```
✅ OVERALL STATUS: HEALTHY - 1-to-1 sync verified
```

**Checklist:**
- [ ] All core objects: Source count = DB count (±2 acceptable)
- [ ] Deduplication working (unique canonical hashes)
- [ ] Webhooks registered and active
- [ ] No critical issues

## Phase 6: Real-time Sync Test (15 min)

### 6.1 Manual Webhook Test

**Steps:**
1. Make a change in the source system (e.g., update a product)
2. Wait 5 seconds
3. Check if webhook was received:

```bash
# Check recent raw ingest records
cd backend
source venv/bin/activate
python -c "
from app.core.db import async_session_factory
from app.models.{datasource}.raw_ingest import {DataSource}RawIngest
from sqlalchemy import select
from datetime import datetime, timedelta
import asyncio

async def check_recent():
    async with async_session_factory() as session:
        cutoff = datetime.utcnow() - timedelta(minutes=5)
        result = await session.execute(
            select({DataSource}RawIngest)
            .where({DataSource}RawIngest.created_at >= cutoff)
            .order_by({DataSource}RawIngest.created_at.desc())
            .limit(10)
        )
        records = result.scalars().all()
        print(f'Recent webhooks (last 5 min): {len(records)}')
        for rec in records:
            print(f'  {rec.created_at} - {rec.object_type} - {rec.source}')

asyncio.run(check_recent())
"
```

**Checklist:**
- [ ] Webhook received within 5 seconds
- [ ] Raw record created with `source = 'webhook'`
- [ ] Refinement processed successfully
- [ ] DB updated with new value

## Phase 7: Performance Check (10 min)

### 7.1 Check Sync Performance

```bash
# Check raw ingest counts by source
cd backend
source venv/bin/activate
python -c "
from app.core.db import async_session_factory
from sqlalchemy import text
import asyncio

async def check_performance():
    async with async_session_factory() as session:
        result = await session.execute(text('''
            SELECT 
                source,
                COUNT(*) as count,
                MIN(created_at) as first_sync,
                MAX(created_at) as last_sync
            FROM {datasource}_raw_ingest
            GROUP BY source
        '''))
        stats = result.all()
        for stat in stats:
            print(f'{stat[0]}: {stat[1]} records')
            print(f'  First: {stat[2]}')
            print(f'  Last: {stat[3]}')

asyncio.run(check_performance())
"
```

### 7.2 Check for Failed Refinements

```bash
cd backend
source venv/bin/activate
python -c "
from app.core.db import async_session_factory
from sqlalchemy import text
import asyncio

async def check_errors():
    async with async_session_factory() as session:
        result = await session.execute(text('''
            SELECT COUNT(*) 
            FROM {datasource}_raw_ingest
            WHERE processing_status = 'error'
        '''))
        error_count = result.scalar_one()
        if error_count > 0:
            print(f'⚠️  Found {error_count} failed refinements')
            # Show sample errors
            result = await session.execute(text('''
                SELECT object_type, error_message
                FROM {datasource}_raw_ingest
                WHERE processing_status = 'error'
                LIMIT 5
            '''))
            errors = result.all()
            for err in errors:
                print(f'  {err[0]}: {err[1][:100]}...')
        else:
            print('✅ No failed refinements')

asyncio.run(check_errors())
"
```

## Phase 8: Documentation (20 min)

### 8.1 Generate Verification Report

```bash
cd backend
source venv/bin/activate
python scripts/verify_{datasource}_integrity.py > reports/{datasource}_verification_$(date +%Y%m%d).txt
```

### 8.2 Create Integration Documentation

**Create/Update:**
- [ ] `docs/{datasource}_integration.md` - Setup guide
- [ ] `docs/{datasource}_data_model.md` - ERD and schema
- [ ] `docs/{datasource}_api_coverage.md` - API endpoint coverage

## Final Checklist

Before marking integration as complete:

- [ ] ✅ All OAuth scopes verified
- [ ] ✅ All database tables exist
- [ ] ✅ All sync functions implemented
- [ ] ✅ All webhooks registered
- [ ] ✅ Deduplication working (0 duplicate hashes)
- [ ] ✅ Data accuracy verified (counts match)
- [ ] ✅ Real-time sync working (<5s latency)
- [ ] ✅ No failed refinements
- [ ] ✅ Verification script passing
- [ ] ✅ Documentation complete

## Success Criteria

**Integration is production-ready when:**

| Metric | Target | Status |
|--------|--------|--------|
| OAuth Scopes | 100% coverage | [ ] |
| Sync Functions | 100% coverage | [ ] |
| Webhooks | 100% registration | [ ] |
| Deduplication | 0 duplicate hashes | [ ] |
| Data Accuracy | ≥99% match | [ ] |
| Real-time Sync | <5s latency | [ ] |
| Error Rate | <1% | [ ] |

## Troubleshooting

### Issue: Count Discrepancy

```bash
# Re-run sync for specific object type
cd backend
source venv/bin/activate
python -c "
from app.services.{datasource}.sync_service import {datasource}_sync_service
from app.core.db import async_session_factory
import asyncio

async def resync():
    async with async_session_factory() as session:
        # Get integration ID
        from app.models.integration import Integration
        from sqlalchemy import select
        result = await session.execute(select(Integration).limit(1))
        integration = result.scalars().first()
        
        # Re-sync specific object type
        stats = await {datasource}_sync_service.fetch_and_ingest_{object_type}(
            session, integration.id
        )
        print(f'Re-sync complete: {stats}')

asyncio.run(resync())
"
```

### Issue: Webhooks Not Processing

```bash
# Check webhook endpoint is reachable
curl -X POST http://localhost:8000/api/v1/integrations/{datasource}/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Re-register webhooks
cd backend
source venv/bin/activate
python -c "
from app.services.{datasource}.oauth_service import {datasource}_oauth_service
from app.core.db import async_session_factory
from app.models.integration import Integration
from sqlalchemy import select
import asyncio

async def reregister():
    async with async_session_factory() as session:
        result = await session.execute(select(Integration).limit(1))
        integration = result.scalars().first()
        
        # Get credentials
        shop = integration.metadata_info['shop']
        token = await {datasource}_oauth_service.get_access_token(integration.id, session)
        
        # Re-register
        results = await {datasource}_oauth_service.register_webhooks(shop, token)
        print(f'Webhook registration: {results}')

asyncio.run(reregister())
"
```

## Next Steps

After passing all checks:

1. **Code Review**: Get senior engineer approval
2. **QA Testing**: Run end-to-end tests
3. **Staging Deployment**: Deploy to staging environment
4. **Production Deployment**: Deploy to production
5. **Monitoring**: Set up alerts and dashboards

## Reference

- Full QA Blueprint: `brain/datasource_qa_blueprint.md`
- Shopify Example: `scripts/verify_shopify_integrity.py`
- Integration Report: `brain/shopify_integrity_report.md`
