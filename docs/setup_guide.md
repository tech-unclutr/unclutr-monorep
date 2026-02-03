# Unclutr.ai Local Setup Guide

Welcome to the Unclutr development team! Follow these steps to get your local environment running exactly like the production/original machine.

## 1. Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher
- **Firebase Project**: Access to a Firebase project for Authentication.
- **Ngrok**: For receiving webhooks locally (optional but recommended).

---

## 2. Environment Configuration

### Backend
1. Go to the `backend/` directory.
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. **Firebase Credentials**: 
   - Get the `serviceAccountKey.json` from the Firebase Console (Project Settings > Service Accounts).
   - Save it as `backend/firebase-credentials.json`.
4. Update `.env` with any specific API keys needed (Shopify, etc.).

### Frontend
1. Go to the `frontend/` directory.
2. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```
3. Fill in the Firebase Client SDK values from the Firebase Console (Project Settings > General > Your Apps).

---

## 3. Backend Setup

1. **Virtual Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Database Migrations**:
   The project uses SQLAlchemy with SQLite for local development. Initialize the database by running:
   ```bash
   alembic upgrade head
   ```
4. **Seed Development Data**:
   To populate initial permissions and modules:
   ```bash
   python scripts/seed_dev.py
   ```
5. **Setup Dev User/Company**:
   To create a default dev user and link them to a company for authentication:
   ```bash
   python setup_dev_auth.py
   ```
6. **Run the Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

## 4. Frontend Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

---

## 5. External Services (Optional)

### Ngrok (Webhooks)
If you need to receive webhooks (e.g., from Shopify):
1. Start ngrok:
   ```bash
   ngrok http 8000
   ```
2. Update the `ALLOWED_ORIGINS` in `backend/.env` or ensure the backend handles the ngrok domain.

---

## Troubleshooting
- **CORS Errors**: Ensure `http://localhost:3000` is in `ALLOWED_ORIGINS` in `backend/.env`.
- **Auth Issues**: Verify `firebase-credentials.json` is present and valid.
- **DB Issues**: If models change, always run `alembic revision --autogenerate` and `alembic upgrade head`.
