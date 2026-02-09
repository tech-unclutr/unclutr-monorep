# SquareUp

**The Decision & Control Layer for D2C Brands.**
Truth-First. AI-Native. Deterministic Financials.

## Project Structure
This is a Monorepo containing both the Next.js Frontend and Python FastAPI Backend.

- **frontend/**: Next.js 14 (App Router), Tailwind CSS, Firebase Auth.
- **backend/**: FastAPI, Python 3.10+, SQLAlchemy (Async), Firebase Admin.

## Getting Started

For a comprehensive guide on setting up your local environment, see [docs/setup_guide.md](docs/setup_guide.md).

### Quick Start

### Backend
1. `cd backend`
2. Create virtual env: `python3 -m venv venv`
3. Activate: `source venv/bin/activate`
4. Install: `pip install -r requirements.txt`
5. Run: `uvicorn app.main:app --reload`
   - Docs: http://localhost:8000/docs

### Frontend
1. `cd frontend`
2. Install: `npm install`
3. Run: `npm run dev`
   - App: http://localhost:3000

## Architecture
For a detailed breakdown of our multi-tenancy model, data isolation, and synchronization pipeline, see [ARCHITECTURE.md](ARCHITECTURE.md).

- **Auth**: Google Firebase (Client SDK calls Backend with Bearer Token).
- **Style**: Minimalist "Tally.so/Notion" aesthetic. High signal, zero noise.
- **Isolation**: Tenant-scoped processing via `X-Company-ID` and `X-Workspace-ID` headers.
