This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Technical Architecture
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + ShadcnUI
- **Data Fetching**: SWR for real-time updates and caching.
- **State Management**: React Context + custom hooks (e.g., `useCompany`).

## Multi-tenancy Integration
The frontend is designed to be tenant-aware:
- **X-Company-ID**: All API calls automatically inject the current active company ID into the headers.
- **Navigation**: Routes preserved company context.
- **Isolation**: Sensitive data is scoped to the active company.

## Setup & Development
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Directory Structure
- `app/`: Next.js App Router pages.
- `components/`: UI components.
- `hooks/`: Custom hooks (auth, company).
- `lib/`: Utility functions.
