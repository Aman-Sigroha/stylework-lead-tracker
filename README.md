# Stylework Lead Tracker

## Overview

Stylework Lead Tracker is a full-stack web application for capturing and managing sales leads. It provides a single-page interface to create leads, browse and search existing leads, and update lead status as they move through the pipeline. The backend exposes a JSON REST API backed by PostgreSQL.

## Features

- **Create lead** — name, email, optional phone, and status (defaults to `new`)
- **List leads** — newest first, up to 100 results per request
- **Search leads** — case-insensitive substring search
- **Search by scope** — All (name, email, phone), or Name, Email, or Phone only
- **Update lead status** — inline status selector per row
- **Health check** — `GET /api/health` for API availability

There is no authentication, pagination UI, or multi-page routing in the current UI.

## Architecture

The browser runs a React SPA that calls the Express API through a shared fetch-based client. TanStack Query manages server state (list, create, status updates). The API validates input with Zod, runs business logic in services, and reads/writes PostgreSQL via `pg` parameterized queries.

```mermaid
flowchart TB
  Browser["Browser"]
  React["React + TypeScript (Vite)"]
  RQ["TanStack Query"]
  Client["API client (fetch)"]
  Express["Express 5 API"]
  Zod["Zod validation"]
  Service["Lead service layer"]
  PG["pg connection pool"]
  DB["PostgreSQL"]

  Browser --> React
  React --> RQ
  RQ --> Client
  Client --> Express
  Express --> Zod
  Zod --> Service
  Service --> PG
  PG --> DB
```

## Tech Stack

| Layer | Technologies |
|--------|----------------|
| **Frontend** | React + TypeScript (React 19), Vite, plain CSS, TanStack Query, React Hook Form, Zod (`@hookform/resolvers`), ESLint |
| **Backend** | Node.js + Express + TypeScript (Express 5, ESM), `pg`, Zod, `dotenv`, `cors` |
| **Database** | PostgreSQL (development uses Neon; connection via `DATABASE_URL`) |
| **Testing** | Backend: Vitest, Supertest. Frontend: Vitest, React Testing Library, jsdom, `@testing-library/user-event` |
| **Tooling** | `tsx` (backend dev/migrations), TypeScript compiler (`tsc`) for backend production build |

The repo root `package.json` is metadata only; install and run scripts live under `backend/` and `frontend/`.

## Project Structure

```
stylework-lead-tracker/
├── README.md
├── package.json              # repo metadata only (no app scripts)
├── .gitignore
├── backend/
│   ├── migrations/
│   │   ├── 001_create_leads.up.sql
│   │   └── 001_create_leads.down.sql
│   ├── src/
│   │   ├── index.ts          # Server entry (dotenv, listen)
│   │   ├── app.ts            # Express app, CORS, JSON, routes
│   │   ├── config/           # env, database pool
│   │   ├── constants/        # lead status values
│   │   ├── controllers/      # HTTP handlers
│   │   ├── routes/           # health + lead routes
│   │   ├── schemas/          # Zod request/query schemas
│   │   ├── services/         # lead business logic + SQL
│   │   ├── scripts/          # db-check.ts, db-migrate.ts
│   │   ├── test/
│   │   │   └── mock-query.ts # Vitest mock for database query()
│   │   ├── types/
│   │   └── leads.api.test.ts # API tests (Supertest, mocked DB)
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
└── frontend/
    ├── index.html
    ├── eslint.config.js
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── lib/              # api-client, env, query-client, api-errors, format-date
    │   ├── types/            # Lead, API response types
    │   ├── test/             # setup.ts, fixtures, render helpers
    │   └── features/leads/
    │       ├── LeadTrackerPage.tsx
    │       ├── LeadTrackerPage.test.tsx
    │       ├── api/leads-api.ts
    │       ├── components/, hooks/, schemas/
    ├── .env.example
    ├── package.json
    ├── vite.config.ts
    └── vitest.config.ts
```

## API Reference

Base path: `/api` (e.g. `http://localhost:3000/api` in local development).

### Common response shapes

**Success (single lead):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1 555 0100",
    "status": "new",
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-25T10:00:00.000Z"
  }
}
```

**Success (lead list):**

```json
{
  "success": true,
  "data": []
}
```

**Validation error (400):**

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email address" }
    ]
  }
}
```

**Other errors (e.g. 404, 500):**

```json
{
  "success": false,
  "error": {
    "message": "Lead not found"
  }
}
```

**Invalid JSON body (400):**

```json
{
  "success": false,
  "error": {
    "message": "Invalid JSON body"
  }
}
```

Timestamps in API responses are ISO 8601 strings (`createdAt`, `updatedAt`).

---

### `POST /api/leads`

Create a new lead.

**Body (JSON):**

| Field | Required | Notes |
|--------|----------|--------|
| `name` | Yes | Non-empty after trim |
| `email` | Yes | Valid email |
| `phone` | No | If provided, must not be empty after trim |
| `status` | No | Defaults to `new`; must be a valid status |

**Example request:**

```http
POST /api/leads
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1 555 0100",
  "status": "new"
}
```

**Success:** `201` with `{ "success": true, "data": { ...lead } }`

**Errors:** `400` validation, `500` with `{ "message": "Failed to create lead" }` on unexpected server/database failure (no stack traces in response)

---

### `GET /api/leads`

List leads, ordered by `created_at` descending. Returns at most **100** rows.

**Query parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `search` | No | Trimmed search string; omitted or empty returns full list (within limit) |
| `searchBy` | No | One of `all`, `name`, `email`, `phone`. Defaults to `all` when `search` is set and `searchBy` is omitted. Ignored when `search` is omitted or empty |

**Examples:**

```http
GET /api/leads
GET /api/leads?search=jane
GET /api/leads?search=jane&searchBy=all
GET /api/leads?search=jane&searchBy=name
GET /api/leads?search=jane@example.com&searchBy=email
GET /api/leads?search=555&searchBy=phone
```

Search uses case-insensitive `ILIKE` on the selected field(s). `phone` matches use `COALESCE(phone, '')`.

**Success:** `200` with `{ "success": true, "data": [ ...leads ] }` (empty array if no matches)

**Errors:** `400` invalid `searchBy` (or other query validation), `500` with `{ "message": "Failed to list leads" }` on server failure

---

### `PATCH /api/leads/:id/status`

Update only the `status` of an existing lead. `updated_at` is maintained by a database trigger.

**Path parameter:** `id` — UUID

**Body (JSON):**

```json
{
  "status": "contacted"
}
```

**Example:**

```http
PATCH /api/leads/550e8400-e29b-41d4-a716-446655440000/status
Content-Type: application/json

{ "status": "contacted" }
```

**Success:** `200` with `{ "success": true, "data": { ...updated lead } }`

**Errors:** `400` invalid UUID or invalid status (validation `details` included), `404` lead not found, `500` with `{ "message": "Failed to update lead status" }` on server failure

---

### `GET /api/health`

**Success:** `200`

```json
{
  "success": true,
  "message": "API is healthy"
}
```

Does not require database access.

## Lead Statuses

Defined in `backend/src/constants/lead-status.ts` and enforced in PostgreSQL:

| Status | Description (pipeline) |
|--------|-------------------------|
| `new` | Default for new leads |
| `contacted` | Initial outreach made |
| `qualified` | Meets qualification criteria |
| `converted` | Won / converted |
| `lost` | Not proceeding |

## Local Development

### Prerequisites

- **Node.js** (LTS recommended; project uses modern ESM and TypeScript)
- **npm**
- **PostgreSQL** database (e.g. [Neon](https://neon.tech) for a hosted dev instance)

### 1. Clone and install

```bash
git clone https://github.com/Aman-Sigroha/stylework-lead-tracker.git
cd stylework-lead-tracker

cd backend
npm install

cd ../frontend
npm install
```

### 2. Environment variables

Do **not** commit real `.env` files (they are gitignored). Copy examples:

**Backend** (`backend/.env` from `backend/.env.example`):

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
# Optional:
# CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`frontend/.env` from `frontend/.env.example`):

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

If `VITE_API_BASE_URL` is unset, the frontend defaults to `http://localhost:3000/api` (`frontend/src/lib/env.ts`).

### 3. Database setup

From `backend/` with `DATABASE_URL` set in `.env`:

```bash
npm run db:check      # optional connectivity check
npm run db:migrate    # applies *.up.sql in backend/migrations/ (sorted)
```

Rollback using down migrations:

```bash
npm run db:migrate:down   # applies *.down.sql in backend/migrations/ (sorted)
```

### 4. Run the backend

From `backend/`:

```bash
npm run dev     # development (tsx watch)
# or
npm run build
npm start       # production: node dist/index.js
```

Default API: `http://localhost:3000` (or `PORT` from `.env`).

### 5. Run the frontend

From `frontend/`:

```bash
npm run dev
```

Default dev server: `http://localhost:5173` (Vite).

Ensure `CORS_ORIGIN` includes the frontend origin if you set it on the backend.

## Environment Variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `PORT` | Backend | HTTP port (default `3000` in code if unset) |
| `NODE_ENV` | Backend | Environment name (e.g. `development`) |
| `DATABASE_URL` | Backend | PostgreSQL connection string (**required** — the pool loads at startup when lead routes are imported) |
| `CORS_ORIGIN` | Backend | Optional comma-separated allowed origins; omit for permissive CORS in dev |
| `VITE_API_BASE_URL` | Frontend | Base URL for API calls (includes `/api`) |

Never commit secrets. Use `.env.example` as a template only.

## Testing

Run tests from `backend/` or `frontend/`. The root `package.json` has no Vitest scripts.

### Backend (`backend/`)

```bash
npm test              # vitest run (once)
npm run test:watch
npm run test:coverage
```

Covers Express routes and validation via **Vitest** and **Supertest** (`src/leads.api.test.ts`, 19 cases), with **`query`** mocked via `src/test/mock-query.ts` (no live PostgreSQL required). Includes create, list/search/`searchBy`, status update, validation, and error cases.

### Frontend (`frontend/`)

```bash
npm test
npm run test:watch
npm run test:coverage
```

Covers **LeadTrackerPage** behavior with **Vitest** and **React Testing Library** (`LeadTrackerPage.test.tsx`, 26 cases; `src/test/setup.ts` for jsdom): list/loading/empty/error states, debounced search and `searchBy`, create-lead modal flow, and status updates. **`leads-api` functions are mocked** (no real backend).

## Build

**Backend** (`backend/`):

```bash
npm run build   # tsc → dist/
npm start       # run compiled output
```

**Frontend** (`frontend/`):

```bash
npm run build   # tsc -b && vite build → frontend/dist/
npm run preview # optional local preview of production build
```

**Lint (frontend only):**

```bash
cd frontend
npm run lint
```

## Deployment

**Live Demo: TBD**

A production hosting platform has not been finalized. Based on the current project layout, a typical deployment would be:

1. **PostgreSQL** — provision a managed instance (e.g. Neon) and set `DATABASE_URL`.
2. **Backend** — build with `npm run build`, run `node dist/index.js` on a Node host; run migrations (`npm run db:migrate`) against the production database before or during release.
3. **Frontend** — build with `npm run build` and serve `frontend/dist` as static files (CDN or static host).
4. **Configuration** — set production `DATABASE_URL`, `PORT` (if required by host), `CORS_ORIGIN` to the frontend origin, and `VITE_API_BASE_URL` to the public API base URL **at frontend build time** (Vite embeds `VITE_*` variables in the bundle).

Replace **Live Demo: TBD** above with the real URL after deployment.

## Engineering Trade-offs

- **PostgreSQL + `pg`** — Relational model fits structured leads, constraints on `status`, and indexed search; parameterized queries avoid SQL injection.
- **Layered backend (routes → controllers → services)** — Clear separation without a heavy repository abstraction for this scope.
- **Zod at the API boundary** — Shared validation rules for body and query params; consistent 400 responses.
- **Safe API errors** — Clients receive generic messages; details are logged server-side for 500s.
- **List cap (100 rows)** — Prevents unbounded reads; pagination is deferred.
- **Server-side search** — `ILIKE` in PostgreSQL rather than loading all leads to the client.
- **TanStack Query** — Caching, refetch, and mutations for list/create/status without manual loading state everywhere.
- **Plain CSS** — No UI framework dependency; feature-scoped styles for the assignment scope.
- **Feature folder (`features/leads`)** — Colocates UI, hooks, and API module for the main domain.
- **Test mocking** — Backend mocks `query`; frontend mocks `leads-api`; fast, deterministic CI-friendly tests without Neon credentials in test runs.

## Future Improvements

- Pagination and sorting options for large lead lists
- Authentication and role-based access
- Additional filters (e.g. by status, date range)
- Audit log / history of status changes
- CI pipeline (lint, test, build on push)
- Rate limiting and production observability (structured logging, metrics)
- Remove or use `react-router-dom` if multi-page navigation is added

These are **not** implemented today.

## Design / UX Notes

- Single-page **Lead Tracker** layout: header, search panel, create-lead action, and leads table.
- **Create lead** opens an accessible `<dialog>` with labeled fields and client-side validation.
- **Search** uses a 300ms debounce; **search by** selector defaults to All.
- Table shows name, email, phone, status (editable `<select>`), and formatted created date; horizontal scroll / stacked rows on smaller viewports.
- Loading, empty, no-results, and error states include a **Retry** action for list fetch failures.

## Assumptions

- **Phone** is optional; empty or omitted phone is stored as `null`.
- **Default status** on create is `new` when not specified.
- **Search:** empty or whitespace-only `search` returns the normal list (subject to the 100-row cap); `searchBy` only affects the query when `search` is non-empty.
- **Status updates** change only `status`; other fields are not editable in the UI.
- **No auth** — API is open in local/dev configuration; production should add protection before public exposure.

## AI-Assisted Development

AI-assisted tools were permitted for this assignment. For a detailed account of
AI usage, prompts, AI-generated sections, manually written sections, and
engineering decisions, see **AGENT.md**.
