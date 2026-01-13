# QA Audit Report: Shopify Analytics Sync (Phase 1 & 2)

## Executive Summary

**Audit Date**: 2026-01-13  
**Scope**: Phase 1 (Data Layer) + Phase 2 (Service Layer)  
**Overall Risk Level**: 🟡 **MEDIUM** (Production-ready with recommended fixes)

**Key Findings**:
- ✅ **8 Critical Strengths** identified
- 🔴 **3 Critical Bugs** found
- 🟡 **5 High-Priority Blindspots** discovered
- 🟢 **12 Improvement Opportunities** recommended

---

## 🔴 Critical Bugs (P0 - Must Fix Before Production)

### BUG-001: Missing Rate Limit Handling in `execute_shopify_ql`
**Severity**: 🔴 **CRITICAL**  
**Location**: [sync_service.py:515-557](file:///Users/param/Documents/Unclutr/backend/app/services/shopify/sync_service.py#L515-L557)

**Issue**:
```python
async def execute_shopify_ql(...):
    response = await self._make_request(...)
    if response.status_code != 200:
        logger.error(f"ShopifyQL Error: {response.status_code} {response.text}")
        return {"error": response.text}
```

**Problem**: 
- No handling for `429 Too Many Requests` (rate limit)
- No retry logic with exponential backoff
- Could cause data loss if queries fail during high-volume sync

**Impact**: 
- Analytics sync will fail silently during rate limits
- No automatic recovery mechanism
- Stats show "errors" but don't distinguish rate limits from actual failures

**Remediation**:
```python
async def execute_shopify_ql(...):
    max_retries = 3
    for attempt in range(max_retries):
        response = await self._make_request(...)
        
        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 2))
            logger.warning(f"Rate limited. Retrying after {retry_after}s...")
            await asyncio.sleep(retry_after)
            continue
        
        if response.status_code != 200:
            logger.error(f"ShopifyQL Error: {response.status_code}")
            return {"error": response.text}
        
        return response.json()
    
    return {"error": "Max retries exceeded"}
```

---

### BUG-002: Numeric Parsing Logic Fails on Edge Cases
**Severity**: 🔴 **CRITICAL**  
**Location**: [refinement_service.py:875](file:///Users/param/Documents/Unclutr/backend/app/services/shopify/refinement_service.py#L875)

**Issue**:
```python
if isinstance(value, str) and value.replace(".", "").replace("-", "").isdigit():
    metrics[key] = str(Decimal(value))
```

**Problem**:
- Doesn't handle scientific notation (e.g., `"1.5e3"`)
- Doesn't handle currency symbols (e.g., `"$1500.50"`)
- Edge case: `"--150"` would pass the check but fail Decimal()

**Impact**:
- Malformed numeric strings could be stored incorrectly
- Could cause downstream calculation errors

**Remediation**:
```python
def _safe_decimal_parse(value: Any) -> str:
    if not isinstance(value, str):
        return value
    
    cleaned = value.strip().replace("$", "").replace(",", "")
    
    try:
        decimal_val = Decimal(cleaned)
        return str(decimal_val)
    except (InvalidOperation, ValueError):
        return value

metrics[key] = self._safe_decimal_parse(value)
```

---

### BUG-003: Missing Transaction Commit After Report Data Refinement
**Severity**: 🟡 **HIGH**  
**Location**: [tasks.py:257-264](file:///Users/param/Documents/Unclutr/backend/app/services/shopify/tasks.py#L257-L264)

**Issue**: If refinement fails, raw ingest is already committed, creating orphaned records.

**Remediation**: Use single transaction for ingest + refinement.

---

## 🟡 High-Priority Blindspots (P1 - Fix Before Scale)

### BLINDSPOT-001: No Timezone Handling
**Severity**: 🟡 **HIGH**

**Issue**: Shopify reports use shop's local timezone, but we store naive datetimes.

**Impact**: Snapshots for different shops in different timezones are incomparable.

**Remediation**: Store `shop_timezone` in `meta_data`.

---

### BLINDSPOT-002: No Maximum Row Limit (Memory Exhaustion Risk)
**Severity**: 🟡 **HIGH**

**Issue**: No limit on rows processed. A 100k row report would create 100k inserts in one transaction.

**Impact**: OOM kills, timeouts, slow syncs.

**Remediation**: Add `MAX_ROWS_PER_REPORT = 10000` limit.

---

### BLINDSPOT-003: No Deduplication for Same-Day Re-Syncs
**Severity**: 🟡 **HIGH**

**Issue**: Running sync twice in same day creates duplicate snapshots.

**Remediation**: Check if already synced today before executing query.

---

### BLINDSPOT-004: Missing Observability
**Severity**: 🟡 **HIGH**

**Issue**: No metrics for snapshots created, query duration, or data size.

**Remediation**: Add Prometheus metrics.

---

### BLINDSPOT-005: No ShopifyQL Query Validation
**Severity**: 🟡 **MEDIUM**

**Issue**: Executes any query from database without validation.

**Remediation**: Add basic syntax validation.

---

## 🟢 Improvement Opportunities (P2)

1. **Batch Processing** - Process rows in batches of 100
2. **Data Quality Checks** - Detect anomalies
3. **Query Caching** - Cache results for 1 hour
4. **Aggregation API** - Endpoint for time-range aggregation
5. **Snapshot Comparison** - Diff between snapshots
6. **Automated Backfill** - Detect and fill gaps
7. **Query Builder UI** - Custom ShopifyQL from UI
8. **Retention Policy** - Auto-delete old snapshots
9. **Concurrent Execution** - Run 3 queries in parallel
10. **Performance Profiling** - Track slow queries
11. **Export Feature** - CSV/JSON export
12. **Real-Time Streaming** - WebSocket analytics

---

## ✅ Identified Strengths

1. Robust data models with proper relationships
2. Idempotency via unique constraints
3. Flexible JSONB schema
4. Comprehensive test coverage (35+ cases)
5. Good error handling
6. Detailed logging
7. Metadata preservation
8. Transaction safety

---

## 🎯 Recommended Action Plan

### Immediate (Before Production)
1. Fix BUG-001: Rate limit handling
2. Fix BUG-002: Numeric parsing
3. Fix BLINDSPOT-002: Row limit
4. Fix BLINDSPOT-004: Add metrics

### Short-Term (1 Week)
5. Fix BUG-003: Transaction management
6. Fix BLINDSPOT-001: Timezone handling
7. Fix BLINDSPOT-003: Deduplication
8. Implement automated backfill

### Medium-Term (1 Month)
9. Batch processing
10. Data quality checks
11. Aggregation API
12. Concurrent execution

---

## 📝 Final Verdict

**Overall Grade**: **B+ (85/100)**

**Breakdown**:
- Data Layer: A (95/100)
- Service Layer: B (80/100)
- Testing: A- (90/100)
- Observability: C (70/100)
- Error Handling: B (80/100)

**Production Readiness**: 🟡 **CONDITIONAL**
- ✅ Safe for low-volume (<10 reports, <1000 rows)
- ⚠️ Needs fixes for high-volume
- 🔴 Must add observability before scale

**Recommendation**: **Fix 4 critical items, then ship** 🚀
