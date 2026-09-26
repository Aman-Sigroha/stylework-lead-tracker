# Stylework Lead Tracker

## Overview

Stylework Lead Tracker is a full-stack web application for capturing and managing sales leads. It provides a single-page interface to create leads, browse and search existing leads, sort the list, edit lead details, update status, and delete leads with confirmation. The backend exposes a JSON REST API backed by PostgreSQL.

## Features

- **Create lead** — name, email, optional phone, and status (defaults to `new`)
- **List leads** — up to 100 results per request; default order is newest first (`created_at` descending)
- **Search leads** — case-insensitive substring search
- **Search by scope** — All (name, email, phone), or Name, Email, or Phone only
- **Sort leads** — by name, email, or status; ascending or descending (or default created-date order)
- **Update lead status** — inline status selector per row
- **Edit lead** — update name, email, phone, and status in a modal
- **Delete lead** — hard delete with a confirmation dialog
- **Health check** — `GET /api/health` for API availability

There is no authentication, pagination UI, or multi-page routing in the current UI.

## Architecture

The browser runs a React SPA that calls the Express API through a shared fetch-based client. TanStack Query manages server state (list, create, edit, delete, status updates, and sort parameters). The API validates input with Zod, runs business logic in services, and reads/writes PostgreSQL via `pg` parameterized queries. The database pool is created lazily on first query so the API can start (and report health) without `DATABASE_URL` until a route needs the database.

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
| **Database** | PostgreSQL on [Neon](https://neon.tech) (connection via `DATABASE_URL`) |
| **Deployment** | [Vercel](https://vercel.com) — static frontend build and Express API (`backend/vercel.json`) |
| **Testing** | Backend: Vitest, Supertest. Frontend: Vitest, React Testing Library, jsdom, `@testing-library/user-event` |
| **Tooling** | `tsx` (backend dev/migrations), TypeScript compiler (`tsc`) for backend production build |

The repo root `package.json` is metadata only; install and run scripts live under `backend/` and `frontend/`.

## Project Structure

```
stylework-lead-tracker/
├── README.md
├── AGENT.md                  # AI-assisted development log (not required to run the app)
├── package.json              # repo metadata only (no app scripts)
├── .gitignore
├── backend/
│   ├── vercel.json           # Vercel Express deployment config
│   ├── migrations/
│   │   ├── 001_create_leads.up.sql
│   │   └── 001_create_leads.down.sql
│   ├── src/
│   │   ├── index.ts          # App export; local listen when not on Vercel
│   │   ├── app.ts            # Express app, CORS, JSON, routes
│   │   ├── config/           # env, lazy database pool
│   │   ├── constants/        # lead status + list sort options
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

Base path: `/api`

| Environment | API base URL |
|-------------|----------------|
| Local | `http://localhost:3000/api` |
| Production | `https://stylework-lead-tracker-backend.vercel.app/api` |

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

List leads. Returns at most **100** rows.

**Default order:** `created_at` descending when `sortBy` is omitted.

**Query parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `search` | No | Trimmed search string; omitted or empty returns full list (within limit) |
| `searchBy` | No | One of `all`, `name`, `email`, `phone`. Defaults to `all` when `search` is set and `searchBy` is omitted. Ignored when `search` is omitted or empty |
| `sortBy` | No | One of `name`, `email`, `status`. Omit for default `created_at` order |
| `sortOrder` | No | `asc` or `desc`. Defaults to `desc` when `sortBy` is set and `sortOrder` is omitted; ignored when `sortBy` is omitted |

When sorting by `status`, order follows pipeline workflow (`new` → `contacted` → `qualified` → `converted` → `lost`), not alphabetical status strings. Name and email sorts use `created_at` descending as a tiebreaker.

**Examples:**

```http
GET /api/leads
GET /api/leads?search=jane
GET /api/leads?search=jane&searchBy=all
GET /api/leads?search=jane&searchBy=name
GET /api/leads?search=jane@example.com&searchBy=email
GET /api/leads?search=555&searchBy=phone
GET /api/leads?sortBy=name&sortOrder=asc
GET /api/leads?sortBy=status&sortOrder=desc
GET /api/leads?search=jane&searchBy=name&sortBy=email&sortOrder=asc
```

Search uses case-insensitive `ILIKE` on the selected field(s). `phone` matches use `COALESCE(phone, '')`.

**Success:** `200` with `{ "success": true, "data": [ ...leads ] }` (empty array if no matches)

**Errors:** `400` invalid `searchBy`, `sortBy`, or `sortOrder` (validation `details` included), `500` with `{ "message": "Failed to list leads" }` on server failure

---

### `PUT /api/leads/:id`

Update an existing lead (name, email, optional phone, optional status). `updated_at` is maintained by a database trigger.

**Path parameter:** `id` — UUID

**Body (JSON):** same field rules as create (`name` and `email` required; `phone` optional; `status` optional).

**Example:**

```http
PUT /api/leads/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1 555 0100",
  "status": "qualified"
}
```

**Success:** `200` with `{ "success": true, "data": { ...updated lead } }`

**Errors:** `400` invalid UUID or validation, `404` lead not found, `500` with `{ "message": "Failed to update lead" }` on server failure

---

### `DELETE /api/leads/:id`

Permanently delete a lead (hard delete).

**Path parameter:** `id` — UUID

**Example:**

```http
DELETE /api/leads/550e8400-e29b-41d4-a716-446655440000
```

**Success:** `200`

```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

**Errors:** `400` invalid UUID, `404` lead not found, `500` with `{ "message": "Failed to delete lead" }` on server failure

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
| `DATABASE_URL` | Backend | PostgreSQL connection string (**required** for lead routes; pool is created on first database query) |
| `VERCEL` | Backend (Vercel) | Set by Vercel (`1`); skips binding a local HTTP port in `index.ts` |
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

Covers Express routes and validation via **Vitest** and **Supertest** (`src/leads.api.test.ts`, `src/config/database.test.ts` — **45** tests total), with **`query`** mocked via `src/test/mock-query.ts` (no live PostgreSQL required). Includes create, list/search/`searchBy`, sorting, full lead update, delete, status update, validation, and error cases.

### Frontend (`frontend/`)

```bash
npm test
npm run test:watch
npm run test:coverage
```

Covers **LeadTrackerPage** behavior with **Vitest** and **React Testing Library** (`LeadTrackerPage.test.tsx`, **45** tests; `src/test/setup.ts` for jsdom): list/loading/empty/error states, debounced search and `searchBy`, sort controls, create- and edit-lead modal flows, delete confirmation, and status updates. **`leads-api` functions are mocked** (no real backend).

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

**Live Demo:** [https://stylework-lead-tracker.vercel.app](https://stylework-lead-tracker.vercel.app)

### Production architecture

| Component | Hosting | URL / notes |
|-----------|---------|-------------|
| **Frontend** | Vercel (Vite static build) | [https://stylework-lead-tracker.vercel.app](https://stylework-lead-tracker.vercel.app) |
| **Backend API** | Vercel (Express via `backend/vercel.json`) | [https://stylework-lead-tracker-backend.vercel.app/api](https://stylework-lead-tracker-backend.vercel.app/api) |
| **Database** | Neon PostgreSQL | `DATABASE_URL` on the backend project only |

The SPA calls the public API using `VITE_API_BASE_URL` baked in at **frontend build time**. The backend allows the frontend origin via `CORS_ORIGIN` and connects to Neon using `DATABASE_URL`.

### Release checklist

1. **Database** — run `npm run db:migrate` from `backend/` against the production Neon database (once per schema change).
2. **Backend (Vercel)** — project root directory `backend/`; set **`DATABASE_URL`** (Neon PostgreSQL) and **`CORS_ORIGIN`** to the frontend origin (e.g. `https://stylework-lead-tracker.vercel.app`). Vercel sets runtime environment variables such as `VERCEL`; you do not need to configure `PORT` for this deployment. `backend/vercel.json` uses the Express framework preset.
3. **Frontend (Vercel)** — project root directory `frontend/`; set `VITE_API_BASE_URL=https://stylework-lead-tracker-backend.vercel.app/api` for production builds, then deploy so the bundle points at the live API.

Health check (no database required): `GET https://stylework-lead-tracker-backend.vercel.app/api/health`

## Engineering Trade-offs

- **PostgreSQL + `pg`** — Relational model fits structured leads, constraints on `status`, and indexed search; parameterized queries avoid SQL injection.
- **Layered backend (routes → controllers → services)** — Clear separation without a heavy repository abstraction for this scope.
- **Zod at the API boundary** — Shared validation rules for body and query params; consistent 400 responses.
- **Safe API errors** — Clients receive generic messages; details are logged server-side for 500s.
- **List cap (100 rows)** — Prevents unbounded reads; pagination UI is deferred.
- **Server-side search and sort** — `ILIKE` and `ORDER BY` in PostgreSQL rather than loading and sorting the full list in the browser.
- **Hard delete** — Deletes remove rows permanently; no soft-delete or undo.
- **TanStack Query** — Caching, refetch, and mutations for list/create/edit/delete/status/sort without manual loading state everywhere.
- **Plain CSS** — No UI framework dependency; feature-scoped styles for the assignment scope.
- **Feature folder (`features/leads`)** — Colocates UI, hooks, and API module for the main domain.
- **Test mocking** — Backend mocks `query`; frontend mocks `leads-api`; fast, deterministic CI-friendly tests without Neon credentials in test runs.

## Future Improvements

- Pagination for large lead lists (beyond the 100-row API cap)
- Authentication and role-based access
- Additional filters (e.g. by status, date range)
- Audit log / history of status changes
- CI pipeline (lint, test, build on push)
- Rate limiting and production observability (structured logging, metrics)
- Remove or use `react-router-dom` if multi-page navigation is added

These are **not** implemented today.

## Design / UX Notes

- Single-page **Lead Tracker** layout: header, search and sort controls, create-lead action, and leads table.
- **Create lead** and **Edit lead** use accessible `<dialog>` modals with shared form fields and client-side validation.
- **Delete lead** uses a confirmation dialog before calling the API.
- **Search** uses a 300ms debounce; **search by** selector defaults to All.
- **Sort** — Default (newest first), or Name / Email / Status with Ascending / Descending (direction disabled for Default).
- Table shows name, email, phone, status (editable `<select>`), formatted created date, and row actions (edit, delete); horizontal scroll / stacked rows on smaller viewports.
- Loading, empty, no-results, and error states include a **Retry** action for list fetch failures.

## Assumptions

- **Phone** is optional; empty or omitted phone is stored as `null`.
- **Default status** on create is `new` when not specified.
- **Search:** empty or whitespace-only `search` returns the normal list (subject to the 100-row cap); `searchBy` only affects the query when `search` is non-empty.
- **Inline status** updates change only `status`; full field edits use the edit modal (`PUT /api/leads/:id`).
- **No auth** — API is open in the current deployment; treat production data accordingly until authentication is added.

## AI-Assisted Development

AI-assisted tools were permitted for this assignment. For a detailed account of
AI usage, prompts, AI-generated sections, manually written sections, and
engineering decisions, see **AGENT.md**.
