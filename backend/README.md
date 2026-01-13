# Unclutr Backend

FastAPI-powered backend for Unclutr.ai.

## Core Stack
- **Framework**: FastAPI
- **Database**: PostgreSQL (via SQLAlchemy & SQLModel)
- **Migrations**: Alembic
- **Auth**: Firebase Admin SDK
- **Task Queue**: (Optional) In-memory scheduler / Background tasks

## Architecture Highlights
- **Multi-tenancy**: High-level isolation via `TenantMiddleware`.
- **Deduplication**: Ingestion service uses composite keys to prevent duplicate data across integrations.
- **Robustness**: Composite unique constraints on Shopify technical IDs for cross-customer safety.

## Setup & Development
1. `cd backend`
2. `python3 -m venv venv`
3. `source venv/bin/activate`
4. `pip install -r requirements.txt`
5. `uvicorn app.main:app --reload`

## Directory Structure
- `app/api`: Endpoint definitions (versioned).
- `app/models`: Database schema using SQLModel.
- `app/services`: Business logic (Sync, Refinement, Onboarding).
- `app/middleware`: Multi-tenancy and logging.
- `migrations`: Alembic migration scripts.
