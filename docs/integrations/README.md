# Data Source Integration Reference Guide

> **Purpose:** Permanent reference for implementing and verifying data source integrations (Shopify, Stripe, QuickBooks, etc.)

**Last Updated:** 2026-01-13  
**Maintained By:** Engineering Team

---

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Integration Checklist](#integration-checklist)
3. [Webhook Coverage Guidelines](#webhook-coverage-guidelines)
4. [QA Verification Process](#qa-verification-process)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)
7. [Reference Examples](#reference-examples)

---

## Quick Start

### For New Data Source Integration

1. **Read the QA Blueprint:** `/Users/param/Documents/Unclutr/.agent/workflows/qa-datasource.md`
2. **Review Shopify Example:** Best-in-class reference implementation
3. **Use Verification Script Template:** `backend/scripts/verify_shopify_integrity.py`
4. **Follow Webhook Coverage Guidelines:** See section below

### For Webhook Analysis

When adding webhooks to any data source, ask these questions:

1. **Does the data source provide webhooks for this resource?**
   - Check official API documentation
   - Search for "{datasource} webhooks {resource_name}"

2. **Will adding a webhook improve accuracy?**
   - **HIGH Impact:** Real-time data that changes frequently (payments, inventory)
   - **MEDIUM Impact:** Data that changes occasionally (customer info, products)
   - **LOW Impact:** Data that's already synced via parent webhooks

3. **Is there a parent webhook that already covers this?**
   - Example: Transactions can be synced via order webhooks
   - But dedicated transaction webhooks are still better!

---

## Integration Checklist

Use this for **every** new data source integration:

### Phase 1: Planning & Design
- [ ] List all data types available from data source API
- [ ] Map data types to database tables
- [ ] Identify OAuth scopes or API permissions needed
- [ ] Research available webhook events
- [ ] Design two-layer architecture (raw + refined)

### Phase 2: Implementation
- [ ] Create OAuth service (if applicable)
- [ ] Create sync service with `fetch_and_ingest_*` functions
- [ ] Implement raw ingest with canonical hash deduplication
- [ ] Create refined models with proper relationships
- [ ] Implement refinement service
- [ ] Register webhooks (all available events)
- [ ] Create webhook handler endpoint

### Phase 3: Verification
- [ ] Run QA blueprint workflow (`/qa-datasource`)
- [ ] Verify OAuth scopes complete
- [ ] Verify all tables exist
- [ ] Verify sync functions work
- [ ] Verify webhooks registered
- [ ] Verify deduplication (0 duplicate hashes)
- [ ] Verify data accuracy (counts match)
- [ ] Verify real-time sync (<5s latency)

### Phase 4: Documentation
- [ ] Create integration guide (`docs/integrations/{datasource}_integration.md`)
- [ ] Document data model (`docs/integrations/{datasource}_data_model.md`)
- [ ] Create API coverage matrix
- [ ] Generate verification report
- [ ] Update this reference guide with lessons learned

---

## Webhook Coverage Guidelines

### Decision Framework

Use this framework to decide whether to add a webhook:

```
┌─────────────────────────────────────────────────────────────┐
│ Is there a webhook available for this resource?             │
└───────────────┬─────────────────────────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
       YES             NO
        │               │
        │               └──> Use polling or parent webhook
        │                    (Document why in code comments)
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Will it improve accuracy vs current approach?               │
└───────────────┬─────────────────────────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
       YES             NO
        │               │
        │               └──> Skip (current approach is optimal)
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ ADD THE WEBHOOK                                             │
│ - Update topics list in oauth_service.py                    │
│ - Add handler in webhook endpoint                           │
│ - Test real-time sync                                       │
│ - Document in integration guide                             │
└─────────────────────────────────────────────────────────────┘
```

### Impact Assessment

| Impact Level | Criteria | Examples |
|--------------|----------|----------|
| 🔥 **HIGH** | Data changes frequently, critical for accuracy | Payments, Inventory, Order Status |
| ⚠️ **MEDIUM** | Data changes occasionally, important but not critical | Customer Info, Product Details |
| ℹ️ **LOW** | Data rarely changes, or already synced via parent | Metadata, Computed Fields |

### Webhook vs Polling Decision Matrix

| Scenario | Webhook Available? | Current Approach | Recommendation |
|----------|-------------------|------------------|----------------|
| **Real-time critical data** | ✅ Yes | Polling | **Add webhook** 🔥 |
| **Real-time critical data** | ❌ No | Polling | Keep polling, document limitation |
| **Sub-resource of parent** | ✅ Yes | Via parent webhook | **Add dedicated webhook** (better accuracy) |
| **Sub-resource of parent** | ❌ No | Via parent webhook | Keep current, already optimal |
| **Rarely changing data** | ✅ Yes | Polling | Add webhook (low priority) |
| **Rarely changing data** | ❌ No | Polling | Keep polling (acceptable) |

---

## QA Verification Process

### Automated Verification Script

Every data source MUST have a verification script:

**Location:** `backend/scripts/verify_{datasource}_integrity.py`

**Template:** Use `verify_shopify_integrity.py` as reference

**What it checks:**
1. OAuth scopes granted
2. Database tables exist
3. Sync functions implemented
4. Webhooks registered
5. Deduplication working (unique canonical hashes)
6. Data accuracy (source count = DB count)
7. Real-time sync working

**Run frequency:**
- During development: After every major change
- Before production: Required for deployment approval
- In production: Weekly automated check

### Manual Verification Checklist

For critical integrations, also perform manual verification:

1. **Create test record in source system**
2. **Verify webhook received** (<5 seconds)
3. **Check raw ingest table** (new record with `source='webhook'`)
4. **Check refined table** (data refined correctly)
5. **Update test record in source system**
6. **Verify update webhook received**
7. **Check raw ingest** (new record, different canonical hash)
8. **Check refined table** (single record, updated values)

---

## Common Patterns

### Pattern 1: Sub-Resources Without Dedicated Webhooks

**Example:** Shopify Inventory Items (before we added webhooks)

**Problem:** Sub-resource data only syncs when parent updates

**Solution:**
1. Check if dedicated webhook exists (search API docs)
2. If yes: Add it!
3. If no: Document limitation, keep parent-based sync

**Code Comment Template:**
```python
# Note: {Resource} does not have dedicated webhooks in {DataSource} API
# Data is synced via parent {ParentResource} webhooks
# Verified: {Date} - {YourName}
# Source: {Link to API docs}
```

### Pattern 2: Financial Data Without Webhooks

**Example:** Shopify Balance Transactions

**Problem:** No webhook available for granular financial records

**Solution:** Sync via batch events (e.g., payout creation)

**Implementation:**
```python
async def fetch_and_ingest_payouts(...):
    # Fetch payouts
    for payout in payouts:
        await ingest_raw_object(..., object_type="payout", ...)
        
        # Fetch associated balance transactions
        balance_txns = await fetch_balance_transactions(payout.id)
        for txn in balance_txns:
            await ingest_raw_object(..., object_type="balance_transaction", ...)
```

### Pattern 3: Nested Resources

**Example:** Shopify Order Line Items

**Best Practice:** Store as separate table with foreign key

**Schema:**
```python
class OrderLineItem(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    order_id: UUID = Field(foreign_key="shopify_order.id")  # Local UUID
    shopify_line_item_id: int  # Shopify's ID
    # ... other fields
```

**Sync:**
```python
# When order webhook fires:
order_data = webhook_payload
for line_item in order_data.get("line_items", []):
    await ingest_raw_object(..., object_type="line_item", payload=line_item)
```

---

## Troubleshooting

### Issue: Webhook Not Firing

**Diagnosis:**
1. Check webhook registration status in integration metadata
2. Verify webhook URL is publicly accessible
3. Check HMAC/signature validation
4. Review data source webhook logs (if available)

**Solution:**
```bash
# Re-register webhooks
cd backend && source venv/bin/activate
python -c "
from app.services.{datasource}.oauth_service import {datasource}_oauth_service
# ... re-registration code
"
```

### Issue: Duplicate Records in Refined Table

**Diagnosis:**
1. Check for unique constraint on `(integration_id, {datasource}_object_id)`
2. Verify deduplication logic in refinement service

**Solution:**
```sql
-- Add unique constraint
ALTER TABLE {datasource}_{object_type}
ADD CONSTRAINT unique_integration_object
UNIQUE (integration_id, {datasource}_object_id);
```

### Issue: Count Discrepancy (Source ≠ DB)

**Diagnosis:**
1. Check for pending refinement records
2. Look for sync errors in logs
3. Verify filtering logic (test data, archived records)

**Solution:**
```bash
# Re-run full sync
cd backend && source venv/bin/activate
python -c "
from app.services.{datasource}.sync_service import {datasource}_sync_service
# ... re-sync code
"
```

---

## Reference Examples

### Shopify Integration (Best-in-Class)

**Files to Review:**
- OAuth: `backend/app/services/shopify/oauth_service.py`
- Sync: `backend/app/services/shopify/sync_service.py`
- Webhooks: `backend/app/api/v1/endpoints/shopify_auth.py`
- Models: `backend/app/models/shopify/*.py`
- Verification: `backend/scripts/verify_shopify_integrity.py`

**Key Features:**
- ✅ 13 OAuth scopes
- ✅ 25+ database tables
- ✅ 13 sync functions
- ✅ 27+ webhooks (after adding inventory_items + transactions)
- ✅ Canonical hash deduplication
- ✅ Two-layer architecture (raw + refined)
- ✅ Comprehensive verification script

**Lessons Learned:**

1. **Always check for dedicated webhooks**
   - We initially missed `inventory_items/*` webhooks
   - We relied on order webhooks for transactions
   - Adding dedicated webhooks improved accuracy significantly

2. **Sub-resources need separate tables**
   - Line items, variants, images all have their own tables
   - Foreign keys use local UUIDs, not source IDs

3. **Deduplication is critical**
   - Canonical hash prevents duplicate raw records
   - Unique constraints prevent duplicate refined records

4. **Verification scripts save time**
   - Automated checks catch issues early
   - Weekly runs ensure ongoing accuracy

### Webhook Coverage Analysis Template

When analyzing webhook coverage for a new data source:

**Document:** `docs/integrations/{datasource}_webhook_analysis.md`

**Template:**
```markdown
# {DataSource} Webhook Coverage Analysis

## Available Webhooks

| Resource | Webhook Topics | Status | Priority |
|----------|---------------|--------|----------|
| Orders | create, update, delete | ✅ Implemented | HIGH |
| Products | create, update, delete | ✅ Implemented | HIGH |
| ... | ... | ... | ... |

## Missing Webhooks

| Resource | Reason | Workaround | Impact |
|----------|--------|------------|--------|
| Balance Txns | Not available in API | Sync via payouts | LOW |
| ... | ... | ... | ... |

## Recommendations

1. Add webhooks for: [list]
2. Keep current approach for: [list]
3. Monitor for new webhooks: [list]

## Implementation

[Code snippets for adding webhooks]
```

---

## Appendix: Quick Reference

### Webhook Addition Checklist

When adding a new webhook to an existing integration:

- [ ] Verify webhook exists in data source API docs
- [ ] Add topic to `oauth_service.py` topics list
- [ ] Add handler in webhook endpoint
- [ ] Add object type mapping
- [ ] Re-register webhooks for existing integrations
- [ ] Test with real webhook event
- [ ] Update documentation
- [ ] Update verification script

### File Locations

| Purpose | Location |
|---------|----------|
| OAuth Service | `backend/app/services/{datasource}/oauth_service.py` |
| Sync Service | `backend/app/services/{datasource}/sync_service.py` |
| Webhook Endpoint | `backend/app/api/v1/endpoints/{datasource}_auth.py` |
| Models | `backend/app/models/{datasource}/*.py` |
| Verification Script | `backend/scripts/verify_{datasource}_integrity.py` |
| Integration Guide | `docs/integrations/{datasource}_integration.md` |
| Webhook Analysis | `docs/integrations/{datasource}_webhook_analysis.md` |
| QA Workflow | `.agent/workflows/qa-datasource.md` |

### Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| OAuth Scopes | 100% coverage | Manual review vs API docs |
| Sync Functions | 100% coverage | Count functions vs data types |
| Webhooks | ≥90% coverage | Count registered vs available |
| Deduplication | 0 duplicates | SQL query for duplicate hashes |
| Data Accuracy | ≥99% match | Verification script |
| Real-time Sync | <5s latency | Manual webhook test |
| Error Rate | <1% | Monitor refinement failures |

---

## Contributing

When you learn something new about data source integrations:

1. **Update this guide** with new patterns or solutions
2. **Add to troubleshooting** if you solved a tricky issue
3. **Update reference examples** with new best practices
4. **Share with team** in engineering sync

---

**Related Documents:**
- [QA Blueprint Workflow](/.agent/workflows/qa-datasource.md)
- [Shopify Integration Guide](/docs/integrations/shopify_integration.md)
- [Shopify Webhook Analysis](/docs/integrations/shopify_webhook_analysis.md)
- [Data Source QA Blueprint](/docs/integrations/datasource_qa_blueprint.md)

**Maintained By:** Engineering Team  
**Questions?** Ask in #engineering-integrations
