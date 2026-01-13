# Data Source Integration QA Blueprint & SOP

## 📋 Purpose

This Standard Operating Procedure (SOP) defines the **complete verification process** for ensuring any data source integration maintains a **100% accurate 1-to-1 real-time copy** of the source system.

**Use this blueprint for:** Shopify, Stripe, QuickBooks, Square, WooCommerce, or any future data source integration.

---

## 🎯 Acceptance Criteria

Before marking any data source integration as "complete," it MUST pass all checks in this blueprint:

- [ ] ✅ **OAuth Scopes**: All required scopes requested and granted
- [ ] ✅ **Sync Functions**: Every data type has a dedicated sync function
- [ ] ✅ **Webhooks**: Real-time webhooks registered for all supported events
- [ ] ✅ **Deduplication**: Canonical hash deduplication working (no duplicates)
- [ ] ✅ **Data Accuracy**: Source counts match DB counts (1-to-1 sync)
- [ ] ✅ **Real-time Sync**: Webhooks triggering and processing correctly
- [ ] ✅ **Error Handling**: Failed syncs logged and retryable
- [ ] ✅ **Audit Trail**: Raw ingest layer preserving all changes

---

## 📊 Verification Process

### Phase 1: Configuration Verification

#### 1.1 OAuth Scopes Audit

**Objective**: Ensure all necessary permissions are requested.

**Steps:**
1. Locate the OAuth service file (e.g., `app/services/{datasource}/oauth_service.py`)
2. Review the `SCOPES` array
3. Cross-reference with data source API documentation
4. Verify each scope maps to specific data types

**Checklist:**
- [ ] All required scopes are listed
- [ ] Scopes match the data types we're syncing
- [ ] No unnecessary scopes requested (principle of least privilege)
- [ ] Scopes are documented with comments explaining what they enable

**Example (Shopify):**
```python
SCOPES = [
    "read_products",              # Products, Variants, Images
    "read_orders",                # Orders, Line Items, Transactions
    "read_customers",             # Customers, Addresses
    "read_inventory",             # Inventory Items, Levels
    "read_locations",             # Locations
    "read_fulfillments",          # Fulfillments
    "read_marketing_events",      # Marketing Events
    "read_checkouts",             # Abandoned Checkouts
    "read_all_orders",            # All Orders (including archived)
    "read_price_rules",           # Price Rules, Discount Codes
    "read_shopify_payments_payouts",   # Payouts
    "read_shopify_payments_disputes",  # Disputes
    "read_reports"                # Shopify Reports
]
```

**Data Source-Specific Notes:**

| Data Source | Scope Location | Notes |
|-------------|---------------|-------|
| **Shopify** | `oauth_service.py` | Use read-only scopes |
| **Stripe** | API keys (no OAuth) | Verify restricted vs full key |
| **QuickBooks** | OAuth 2.0 scopes | Requires `com.intuit.quickbooks.accounting` |
| **Square** | OAuth scopes | Separate scopes per resource type |

---

#### 1.2 Database Schema Verification

**Objective**: Confirm all data types have corresponding database tables.

**Steps:**
1. List all data types from the data source API documentation
2. Verify each has a SQLModel in `app/models/{datasource}/`
3. Check for proper relationships (foreign keys)
4. Verify `raw_ingest` table exists

**Checklist:**
- [ ] Raw ingest table exists (`{datasource}_raw_ingest`)
- [ ] All core data types have refined tables
- [ ] Foreign key relationships are correct
- [ ] Composite unique constraints on `(integration_id, {datasource}_object_id)`
- [ ] `created_at`, `updated_at` timestamps on all tables
- [ ] `integration_id` and `company_id` on all tables (stamping)

**Required Tables (Minimum):**
```
✅ {datasource}_raw_ingest       # Immutable audit log
✅ {datasource}_[core_objects]   # Main business objects
✅ {datasource}_[sub_objects]    # Related/nested objects
```

**Example (Shopify):**
```
✅ shopify_raw_ingest
✅ shopify_order
✅ shopify_line_item
✅ shopify_product
✅ shopify_product_variant
✅ shopify_customer
✅ shopify_inventory_level
... (25+ tables total)
```

---

### Phase 2: Sync Function Coverage

#### 2.1 Sync Function Inventory

**Objective**: Verify every data type has a sync function.

**Steps:**
1. Open `app/services/{datasource}/sync_service.py`
2. List all `fetch_and_ingest_*` functions
3. Map each function to data types
4. Verify pagination handling
5. Check rate limit handling

**Checklist:**
- [ ] Every data type has a `fetch_and_ingest_*` function
- [ ] Pagination implemented (cursor or page-based)
- [ ] Rate limit handling with exponential backoff
- [ ] Error handling and logging
- [ ] Support for incremental sync (`start_date` parameter)
- [ ] Proper timeout configuration

**Function Template:**
```python
async def fetch_and_ingest_{object_type}(
    self,
    session: AsyncSession,
    integration_id: UUID,
    start_date: Optional[datetime] = None
) -> Dict[str, int]:
    """
    Fetches {Object Type} from {DataSource}.
    
    Args:
        session: Database session
        integration_id: Integration UUID
        start_date: Optional date for incremental sync
        
    Returns:
        Dict with 'fetched', 'ingested', 'errors' counts
    """
    # 1. Get credentials
    # 2. Paginate through API
    # 3. Ingest raw data
    # 4. Return stats
```

**Required Sync Functions by Data Source:**

<details>
<summary><strong>Shopify</strong></summary>

- [ ] `fetch_and_ingest_orders`
- [ ] `fetch_and_ingest_customers`
- [ ] `fetch_and_ingest_products`
- [ ] `fetch_and_ingest_inventory`
- [ ] `fetch_and_ingest_transactions`
- [ ] `fetch_and_ingest_refunds`
- [ ] `fetch_and_ingest_fulfillments`
- [ ] `fetch_and_ingest_checkouts`
- [ ] `fetch_and_ingest_price_rules`
- [ ] `fetch_and_ingest_payouts`
- [ ] `fetch_and_ingest_disputes`
- [ ] `fetch_and_ingest_marketing_events`
- [ ] `fetch_and_ingest_reports`

</details>

<details>
<summary><strong>Stripe</strong></summary>

- [ ] `fetch_and_ingest_charges`
- [ ] `fetch_and_ingest_customers`
- [ ] `fetch_and_ingest_invoices`
- [ ] `fetch_and_ingest_subscriptions`
- [ ] `fetch_and_ingest_payment_intents`
- [ ] `fetch_and_ingest_refunds`
- [ ] `fetch_and_ingest_disputes`
- [ ] `fetch_and_ingest_payouts`
- [ ] `fetch_and_ingest_balance_transactions`

</details>

<details>
<summary><strong>QuickBooks</strong></summary>

- [ ] `fetch_and_ingest_invoices`
- [ ] `fetch_and_ingest_customers`
- [ ] `fetch_and_ingest_payments`
- [ ] `fetch_and_ingest_bills`
- [ ] `fetch_and_ingest_vendors`
- [ ] `fetch_and_ingest_items`
- [ ] `fetch_and_ingest_accounts`
- [ ] `fetch_and_ingest_journal_entries`

</details>

---

#### 2.2 Ingestion Logic Verification

**Objective**: Ensure `ingest_raw_object` handles all edge cases.

**Checklist:**
- [ ] Canonical hash generation (SHA-256 of sorted JSON)
- [ ] Deduplication check before insert
- [ ] Shopify/Source ID extraction
- [ ] Updated timestamp parsing
- [ ] Diff calculation for webhooks (optional but recommended)
- [ ] Proper error handling

**Critical Code Review:**
```python
async def ingest_raw_object(
    self,
    session: AsyncSession,
    integration: Integration,
    object_type: str,
    payload: Dict[str, Any],
    source: str = "backfill",
    topic: Optional[str] = None
) -> RawIngest:
    # 1. Extract ID and timestamp
    # 2. Generate canonical hash
    # 3. Check for duplicates
    # 4. Calculate diff (for webhooks)
    # 5. Insert record
```

---

### Phase 3: Webhook Coverage

#### 3.1 Webhook Registration Verification

**Objective**: Confirm all webhooks are registered with the data source.

**Steps:**
1. Review `register_webhooks` function in `oauth_service.py`
2. List all webhook topics
3. Verify webhook endpoint URLs
4. Check webhook verification (HMAC)

**Checklist:**
- [ ] All CRUD events covered (create, update, delete)
- [ ] Webhook endpoint URLs are correct
- [ ] HMAC verification implemented
- [ ] Retry logic for failed registrations
- [ ] Webhook status stored in `integration.metadata_info`

**Webhook Topics Template:**
```python
topics = [
    "{object}/create",
    "{object}/update",
    "{object}/delete",
    # ... for all major objects
]
```

**Example (Shopify):**
```python
topics = [
    "orders/create", "orders/updated", "orders/delete",
    "products/create", "products/update", "products/delete",
    "customers/create", "customers/update", "customers/delete",
    "inventory_levels/update",
    "fulfillments/create", "fulfillments/update",
    "refunds/create",
    # ... 24 total
]
```

---

#### 3.2 Webhook Handler Verification

**Objective**: Ensure webhook endpoint processes events correctly.

**Steps:**
1. Review `handle_{datasource}_webhook` endpoint
2. Verify HMAC validation
3. Check object type routing
4. Verify immediate refinement trigger

**Checklist:**
- [ ] HMAC/signature verification
- [ ] Topic-to-object-type mapping
- [ ] Raw ingestion
- [ ] Immediate refinement call
- [ ] Stats recalculation
- [ ] Error handling (don't fail webhook on refinement errors)

**Critical Code Review:**
```python
@router.post("/webhooks/{topic:path}")
async def handle_webhook(
    topic: str,
    request: Request,
    x_signature_header: str = Header(None)
):
    # 1. Verify HMAC
    # 2. Parse payload
    # 3. Find integration
    # 4. Ingest raw
    # 5. Trigger refinement
    # 6. Return 200 OK
```

---

### Phase 4: Deduplication Verification

#### 4.1 Canonical Hash Uniqueness

**Objective**: Verify no duplicate canonical hashes exist.

**SQL Query:**
```sql
SELECT 
    dedupe_hash_canonical,
    COUNT(*) as count
FROM {datasource}_raw_ingest
WHERE integration_id = '{integration_id}'
GROUP BY dedupe_hash_canonical
HAVING COUNT(*) > 1;
```

**Expected Result:** 0 rows (all hashes unique)

**Checklist:**
- [ ] All canonical hashes are unique
- [ ] Hash generation uses sorted JSON keys
- [ ] Hash includes all relevant fields

---

#### 4.2 Object Update Tracking

**Objective**: Verify updated objects create new raw records but maintain single refined record.

**SQL Query:**
```sql
SELECT 
    object_type,
    {datasource}_object_id,
    COUNT(*) as raw_count
FROM {datasource}_raw_ingest
WHERE integration_id = '{integration_id}'
  AND {datasource}_object_id IS NOT NULL
GROUP BY object_type, {datasource}_object_id
HAVING COUNT(*) > 1
ORDER BY raw_count DESC
LIMIT 10;
```

**Expected Result:** Multiple raw records for updated objects (this is correct!)

**Checklist:**
- [ ] Updated objects have multiple raw records
- [ ] Each raw record has unique canonical hash
- [ ] Refined table has only 1 record per object
- [ ] Refined record reflects latest state

---

### Phase 5: Data Accuracy Verification

#### 5.1 Count Comparison

**Objective**: Verify source counts match DB counts (1-to-1 sync).

**Process:**
1. Fetch count from data source API
2. Query count from local DB
3. Compare and document discrepancies

**Automated Script Template:**
```python
async def verify_counts(integration_id: UUID):
    """Compare source API counts with DB counts"""
    
    # For each object type:
    # 1. Fetch count from source API
    source_count = await fetch_source_count(object_type)
    
    # 2. Query DB count
    db_count = await session.execute(
        select(func.count(Model.id))
        .where(Model.integration_id == integration_id)
    ).scalar_one()
    
    # 3. Compare
    if source_count == db_count:
        print(f"✅ {object_type}: Perfect sync ({db_count}/{source_count})")
    else:
        print(f"❌ {object_type}: Discrepancy (DB: {db_count}, Source: {source_count})")
```

**Acceptable Discrepancies:**
- ±1-2 records during active sync (race conditions)
- Test/demo data in source but filtered out locally
- Archived/deleted records (if not syncing historical deletes)

**Checklist:**
- [ ] Orders: Source count = DB count
- [ ] Products: Source count = DB count
- [ ] Customers: Source count = DB count
- [ ] All other core objects: Source count = DB count
- [ ] Discrepancies documented and explained

---

#### 5.2 Sample Data Verification

**Objective**: Verify individual records match between source and DB.

**Process:**
1. Pick 5-10 random objects from source
2. Fetch full details from source API
3. Query same objects from DB
4. Compare field-by-field

**Checklist:**
- [ ] All fields present in DB
- [ ] Field values match exactly
- [ ] Timestamps parsed correctly
- [ ] Nested objects (variants, line items) synced
- [ ] Relationships (foreign keys) correct

---

### Phase 6: Real-time Sync Verification

#### 6.1 Webhook Delivery Test

**Objective**: Confirm webhooks are being received and processed.

**Manual Test:**
1. Make a change in the source system (e.g., update product price)
2. Check webhook logs for incoming request
3. Verify raw ingest record created
4. Verify refinement processed
5. Verify DB updated with new value

**Checklist:**
- [ ] Webhook received within 5 seconds
- [ ] HMAC validation passed
- [ ] Raw record created
- [ ] Refinement completed
- [ ] DB reflects new value
- [ ] Stats recalculated

---

#### 6.2 Webhook Failure Handling

**Objective**: Verify failed webhooks are logged and retryable.

**Test:**
1. Temporarily break refinement (e.g., invalid SQL)
2. Trigger webhook
3. Verify raw record created but marked as error
4. Fix refinement
5. Manually retry failed records
6. Verify success

**Checklist:**
- [ ] Failed refinements logged
- [ ] Raw record marked with `processing_status = 'error'`
- [ ] Error message captured
- [ ] Retry mechanism exists
- [ ] Webhook doesn't fail (returns 200 OK)

---

### Phase 7: Performance & Scalability

#### 7.1 Pagination Efficiency

**Objective**: Verify large datasets sync efficiently.

**Test:**
1. Sync integration with 1000+ records
2. Monitor memory usage
3. Check for timeout errors
4. Verify all pages fetched

**Checklist:**
- [ ] Pagination working (no infinite loops)
- [ ] Memory usage stable (no leaks)
- [ ] No timeout errors
- [ ] All records synced
- [ ] Rate limits respected

---

#### 7.2 Rate Limit Handling

**Objective**: Verify rate limits don't cause sync failures.

**Test:**
1. Trigger multiple concurrent syncs
2. Monitor for 429 errors
3. Verify exponential backoff
4. Verify eventual success

**Checklist:**
- [ ] 429 errors detected
- [ ] Exponential backoff implemented
- [ ] Retry-After header respected
- [ ] Sync completes successfully
- [ ] No data loss

---

## 🔧 Automated Verification Script Template

Create `scripts/verify_{datasource}_integrity.py`:

```python
"""
{DataSource} Data Integrity Verification Script
"""

import asyncio
from datetime import datetime, timezone
from sqlalchemy import func, select
from app.core.db import async_session_factory
from app.models.integration import Integration
from app.models.{datasource}.raw_ingest import {DataSource}RawIngest
# ... import all models

class {DataSource}IntegrityVerifier:
    def __init__(self):
        self.api_version = "{version}"
        self.issues = []
        self.warnings = []
        self.successes = []
        
    async def verify_all(self, integration_id: str):
        """Main verification orchestrator"""
        async with async_session_factory() as session:
            integration = await session.get(Integration, integration_id)
            
            print(f"\n{'='*80}")
            print(f"🔍 {DATASOURCE} DATA INTEGRITY VERIFICATION")
            print(f"{'='*80}\n")
            
            # Run all checks
            await self.verify_oauth_scopes(integration)
            await self.verify_database_schema(session, integration)
            await self.verify_sync_functions()
            await self.verify_webhooks(integration)
            await self.verify_deduplication(session, integration)
            await self.verify_data_accuracy(session, integration)
            await self.verify_realtime_sync(session, integration)
            
            # Print summary
            self.print_summary()
    
    async def verify_oauth_scopes(self, integration):
        """Verify all required scopes are granted"""
        # Implementation
        pass
    
    async def verify_database_schema(self, session, integration):
        """Verify all tables exist and have correct structure"""
        # Implementation
        pass
    
    async def verify_sync_functions(self):
        """Verify all data types have sync functions"""
        # Implementation
        pass
    
    async def verify_webhooks(self, integration):
        """Verify webhooks are registered"""
        # Implementation
        pass
    
    async def verify_deduplication(self, session, integration):
        """Verify canonical hash uniqueness"""
        # Check for duplicate hashes
        # Check for proper object update tracking
        pass
    
    async def verify_data_accuracy(self, session, integration):
        """Verify source counts match DB counts"""
        # For each object type:
        # 1. Fetch count from source API
        # 2. Query DB count
        # 3. Compare
        pass
    
    async def verify_realtime_sync(self, session, integration):
        """Verify webhooks are working"""
        # Check webhook registration status
        # Check recent webhook activity
        pass
    
    def print_summary(self):
        """Print verification summary"""
        print(f"\n{'='*80}")
        print(f"📊 VERIFICATION SUMMARY")
        print(f"{'='*80}\n")
        
        print(f"✅ Successes: {len(self.successes)}")
        for success in self.successes:
            print(f"   {success}")
        
        if self.warnings:
            print(f"\n⚠️  Warnings: {len(self.warnings)}")
            for warning in self.warnings:
                print(f"   {warning}")
        
        if self.issues:
            print(f"\n❌ Issues: {len(self.issues)}")
            for issue in self.issues:
                print(f"   {issue}")
        else:
            print(f"\n🎉 NO CRITICAL ISSUES FOUND!")
        
        # Overall status
        if not self.issues:
            print("\n✅ OVERALL STATUS: HEALTHY - 1-to-1 sync verified")
        else:
            print("\n❌ OVERALL STATUS: CRITICAL ISSUES - Immediate attention required")

async def main():
    verifier = {DataSource}IntegrityVerifier()
    # Get integration ID from args or query
    await verifier.verify_all(integration_id)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 📝 Data Source-Specific Checklists

### Shopify Integration Checklist

- [ ] **OAuth Scopes**: 13 scopes (read_products, read_orders, etc.)
- [ ] **Database Tables**: 25+ tables (orders, products, customers, inventory, etc.)
- [ ] **Sync Functions**: 13 functions covering all data types
- [ ] **Webhooks**: 24 topics registered
- [ ] **Deduplication**: Canonical hash on raw_ingest
- [ ] **Data Accuracy**: Orders, Products, Customers counts match
- [ ] **Real-time Sync**: Webhooks processing within 5 seconds
- [ ] **Verification Script**: `verify_shopify_integrity.py` passing

### Stripe Integration Checklist

- [ ] **API Keys**: Restricted key with minimum permissions
- [ ] **Database Tables**: charges, customers, invoices, subscriptions, etc.
- [ ] **Sync Functions**: 9+ functions for core objects
- [ ] **Webhooks**: 20+ event types registered
- [ ] **Deduplication**: Stripe ID-based deduplication
- [ ] **Data Accuracy**: Charges, Customers, Invoices counts match
- [ ] **Real-time Sync**: Webhooks processing within 5 seconds
- [ ] **Idempotency**: Idempotency keys for API requests

### QuickBooks Integration Checklist

- [ ] **OAuth Scopes**: `com.intuit.quickbooks.accounting`
- [ ] **Database Tables**: invoices, customers, payments, bills, etc.
- [ ] **Sync Functions**: 8+ functions for accounting objects
- [ ] **Webhooks**: QuickBooks webhooks registered
- [ ] **Deduplication**: QuickBooks ID + SyncToken
- [ ] **Data Accuracy**: Invoices, Customers, Payments counts match
- [ ] **Real-time Sync**: Webhooks processing within 5 seconds
- [ ] **Token Refresh**: OAuth token refresh working

---

## 🚨 Common Issues & Troubleshooting

### Issue: Count Discrepancy

**Symptoms:** Source count ≠ DB count

**Diagnosis:**
1. Check for pending refinement records
2. Verify sync completed without errors
3. Check for test/demo data filtering
4. Look for archived/deleted records

**Resolution:**
- Run full re-sync if discrepancy > 5%
- Investigate specific missing records
- Update filtering logic if needed

---

### Issue: Duplicate Records

**Symptoms:** Multiple records for same object in refined table

**Diagnosis:**
1. Check unique constraints
2. Verify deduplication logic
3. Check for race conditions

**Resolution:**
- Add/fix unique constraint on `(integration_id, {datasource}_object_id)`
- Fix deduplication logic in refinement service
- Add database-level constraint

---

### Issue: Webhooks Not Processing

**Symptoms:** Changes in source not reflected in DB

**Diagnosis:**
1. Check webhook registration status
2. Verify webhook endpoint is reachable
3. Check HMAC validation
4. Review webhook logs

**Resolution:**
- Re-register webhooks
- Fix HMAC validation
- Check firewall/network settings
- Verify ngrok/tunnel is running (dev)

---

### Issue: Refinement Failures

**Symptoms:** Raw records stuck in "pending" status

**Diagnosis:**
1. Check refinement service logs
2. Look for SQL errors
3. Check for missing foreign keys
4. Verify data type conversions

**Resolution:**
- Fix SQL errors
- Add missing parent records
- Update data type casting
- Retry failed records

---

## 📊 Success Metrics

A data source integration is considered **production-ready** when:

| Metric | Target | Status |
|--------|--------|--------|
| **OAuth Scopes** | 100% coverage | ✅ |
| **Sync Functions** | 100% coverage | ✅ |
| **Webhooks** | 100% registration | ✅ |
| **Deduplication** | 0 duplicate hashes | ✅ |
| **Data Accuracy** | ≥99% match | ✅ |
| **Real-time Sync** | <5s latency | ✅ |
| **Error Rate** | <1% | ✅ |
| **Uptime** | >99.9% | ✅ |

---

## 🔄 Ongoing Monitoring

### Weekly Checks

- [ ] Run verification script
- [ ] Review error logs
- [ ] Check webhook success rate
- [ ] Verify counts still match

### Monthly Checks

- [ ] Review API rate limit usage
- [ ] Check for new API endpoints/data types
- [ ] Update scopes if needed
- [ ] Performance optimization review

### Quarterly Checks

- [ ] API version updates
- [ ] Security audit (credentials, encryption)
- [ ] Scalability testing
- [ ] Documentation updates

---

## 📚 Documentation Requirements

For each data source integration, maintain:

1. **Integration Guide** (`docs/{datasource}_integration.md`)
   - OAuth setup instructions
   - Required scopes explanation
   - Webhook configuration
   - Troubleshooting guide

2. **Data Model Documentation** (`docs/{datasource}_data_model.md`)
   - ERD diagram
   - Table descriptions
   - Relationship explanations
   - Field mappings

3. **API Coverage Matrix** (`docs/{datasource}_api_coverage.md`)
   - List of all API endpoints
   - Coverage status (synced/not synced)
   - Justification for excluded endpoints

4. **Verification Report** (`reports/{datasource}_verification_{date}.md`)
   - Latest verification results
   - Known issues
   - Improvement recommendations

---

## ✅ Final Checklist

Before marking integration as complete:

- [ ] All phases of this SOP completed
- [ ] Verification script created and passing
- [ ] Documentation written
- [ ] Code reviewed by senior engineer
- [ ] QA testing completed
- [ ] Production deployment plan approved
- [ ] Monitoring and alerts configured
- [ ] Runbook created for on-call engineers

---

## 🎓 Training & Knowledge Transfer

New team members should:

1. Read this SOP thoroughly
2. Review existing integration (Shopify) as reference
3. Run verification script and understand output
4. Shadow senior engineer on next integration
5. Lead verification for subsequent integration

---

*Last Updated: 2026-01-13*  
*Version: 1.0*  
*Owner: Engineering Team*
