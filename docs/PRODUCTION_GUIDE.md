# SquareUp Production Guide

## 1. Backend (Python/FastAPI)

### Setup
Ensure you have `.env` set up with production values (see `.env.example`).
Important: Set `ENVIRONMENT=production`.

### Running with Gunicorn
Use the provided Gunicorn configuration for robust production styling.

```bash
cd backend
# Install production dependencies if needed (e.g. gunicorn)
pip install gunicorn uvloop httptools

# Run
gunicorn -c gunicorn_conf.py app.main:app
```

## 2. Frontend (Next.js)

### Setup
Ensure `.env.production` contains the correct `API_URL`.

### Build & Run
```bash
cd frontend
npm run build
npm start
```

## 3. Database (Supabase)
The database is hosted on Supabase.
To migrate changes from local to production:
1. Make changes locally (using local Postgres).
2. Use `scripts/migrate_to_supabase.sh` (CAUTION: This overwrites production!).
3. OR use Alembic migrations (Recommended for incremental updates).
