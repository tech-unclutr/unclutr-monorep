# Unclutr Architecture & Multi-tenancy

This document outlines the core architecture of Unclutr, specifically focusing on how we handle multi-tenancy, data isolation, and robust synchronization with external platforms like Shopify.

## 1. Multi-tenancy Model

Unclutr is built from the ground up as a multi-tenant system. The hierarchy is as follows:

- **Company**: The top-level entity representing a customer organization.
- **Brand**: (Optional) A logical grouping of assets within a company.
- **Workspace**: A project or environment (e.g., "Production", "Testing") belonging to a company.
- **Integration**: A specific connection to a data source (e.g., a Shopify store) linked to a workspace and company.

## 2. Data Isolation Strategy

### Backend (FastAPI)
- **Tenant Middleware**: Every request (except public ones) must include `X-Company-ID` and `X-Workspace-ID` headers. The `TenantMiddleware` validates these against the authenticated user's `CompanyMembership`.
- **Context Handling**: We use `contextvars` to store the active `company_id` and `workspace_id` for the duration of the request, ensuring they are available to all services and database queries.

### Database (PostgreSQL / SQLModel)
- All records related to a customer (Orders, Products, Customers, etc.) include `company_id` and `integration_id`.
- **Robust Unique Constraints**: For external IDs (like Shopify Object IDs), we use composite unique constraints `(integration_id, shopify_object_id)`. This prevents global ID collisions and allows multiple customers to safely store the same Shopify ID in our database.

## 3. Data Ingestion Pipeline

The synchronization process follows a "Fetch -> Ingest -> Refine" flow:

1.  **Fetch**: Data is pulled from the source (e.g., Shopify API) or received via Webhooks.
2.  **Ingest (Raw)**: The exact JSON response from the provider is stored in a "raw" table (e.g., `ShopifyRawObject`). This serves as our source of truth.
3.  **Refine (Structured)**: The `ShopifyRefinementService` parses the raw JSON and upserts it into structured domain models (e.g., `ShopifyOrder`, `ShopifyProduct`).

## 4. Frontend (Next.js)

- **Header Injection**: Our base API client automatically injects the active `X-Company-ID` from the user's current context into every request.
- **Context Isolation**: The frontend state is keyed by `companyId`, ensuring that switching companies clears or revalidates all sensitive data caches.

## 5. Security

- **Auth**: Handled by Firebase Admin on the backend and Firebase Client SDK on the frontend.
- **IAM**: Role-based access control (RBAC) via `CompanyMembership` (Owner, Admin, Member, Viewer).
