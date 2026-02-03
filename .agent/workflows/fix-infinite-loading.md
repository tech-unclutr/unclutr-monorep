---
description: Fix infinite loading on Settings/Intelligence pages
---

# Troubleshooting: Infinite Loading on Frontend Pages

When the Settings page or Customer Intelligence Lab shows infinite loading, follow these steps:

## Step 1: Check if Backend Server is Running

```bash
# Check if port 8000 is in use
lsof -i:8000

# Test if server responds
curl http://localhost:8000/docs
```

**If server is not running or not responding:**
- Check for syntax errors in the terminal where uvicorn is running
- Look for Python import errors or startup failures
- Restart the server:
```bash
# turbo
lsof -ti:8000 | xargs kill -9
/tmp/venv_unclutr/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Step 2: Check Browser Console for API Errors

Open DevTools (Cmd+Option+I) → Console tab and look for:
- **401/403 errors**: Authentication issue
- **404 errors**: Endpoint not found (check if router is registered)
- **500 errors**: Backend crash (check uvicorn logs)
- **Pending requests**: Server is frozen or endpoint is hanging

## Step 3: Verify Database Has Required Data

Run this diagnostic script:

```bash
# turbo
/tmp/venv_unclutr/bin/python3 -c "
import asyncio
from sqlalchemy import text
import sys
sys.path.append('.')
from app.core.db import get_session

async def check():
    session_gen = get_session()
    session = await session_gen.__anext__()
    try:
        # Check user exists
        result = await session.execute(text(\"\"\"
            SELECT email, current_company_id FROM \\\"user\\\" 
            WHERE email = 'tech.unclutr@gmail.com'
        \"\"\"))
        user = result.first()
        if not user:
            print('❌ User not found!')
            return
        print(f'✅ User: {user[0]}')
        
        # Check company exists
        if user[1]:
            result = await session.execute(text(f\"\"\"
                SELECT brand_name FROM company WHERE id = '{user[1]}'
            \"\"\"))
            company = result.first()
            if company:
                print(f'✅ Company: {company[0]}')
            else:
                print(f'❌ Company not found for ID: {user[1]}')
        else:
            print('❌ User has no company_id set!')
    finally:
        await session.close()

asyncio.run(check())
"
```

**If data is missing:**
- Restore from stable checkpoint: `/revert-to-stable-data`
- Or run: `python3 scripts/restore_data_only.py`

## Step 4: Check for Missing Tables

If restoration fails with "relation does not exist" errors:

```bash
# turbo
/tmp/venv_unclutr/bin/python3 -c "
import asyncio
import sys
sys.path.append('.')
from app.core.db import engine
from sqlmodel import SQLModel
import app.models

async def fix_schema():
    print('Creating missing tables...')
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    print('✅ Schema fixed')

asyncio.run(fix_schema())
"
```

Then re-run the data restoration.

## Step 5: Common Fixes

### Fix 1: Server Won't Start (Syntax Error)
Look for the error line in uvicorn output:
```
File "/path/to/file.py", line 123
    SyntaxError: invalid syntax
```
Open that file and fix the syntax error (often unclosed strings, missing colons, etc.)

### Fix 2: Database Connection Issues
```bash
# Check if PostgreSQL is running
psql -d postgres -c "SELECT 1"

# If not, start it (Mac):
brew services start postgresql
```

### Fix 3: Frontend Can't Reach Backend
- Verify backend is on port 8000: `lsof -i:8000`
- Check CORS settings in `app/main.py`
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`

### Fix 4: Authentication Issues
If getting 401 errors:
- Check Firebase token is valid (refresh the page)
- Verify `get_current_user` dependency is working
- Check Firebase project settings match `.env`

## Quick Recovery Command

If you just need to get everything working ASAP:

```bash
# Kill and restart backend
lsof -ti:8000 | xargs kill -9 && sleep 2 && /tmp/venv_unclutr/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# In another terminal, hard refresh frontend
# Then in browser: Cmd+Shift+R
```

## Prevention

To avoid this issue:
1. **Always use `/mark-stable`** before making risky changes
2. **Test backend startup** after code changes: `python3 -c "import app.main"`
3. **Use `/verify-health`** regularly to check system integrity
4. **Keep stable backups** of your database (automated via `/mark-stable`)

## Related Workflows

- `/revert-to-stable-data` - Restore database to last checkpoint
- `/start-servers` - Robustly restart all servers
- `/verify-health` - Check system health
