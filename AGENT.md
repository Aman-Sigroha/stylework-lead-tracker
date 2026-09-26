# AI-Assisted Development Log

## 1. Purpose

This document records how AI tools were used while building the **Stylework Lead Tracker** for the Stylework Junior Full Stack Engineer assignment. The assignment explicitly permitted and encouraged the use of AI-assisted development tools; this log explains which tools were used, for what tasks, and how the developer remained responsible for review, testing, and final decisions.

It complements `README.md` (technical overview) and is intended for reviewers who want transparency about AI involvement without overstating or understating it.

## 2. AI Tools Used

### Cursor

**Cursor** was the primary AI-assisted coding environment. Implementation work was delivered in focused increments through Cursor Agent sessions, including:

- Backend scaffolding (Express 5, TypeScript ESM, health route, app wiring)
- PostgreSQL integration (`pg` pool, `DATABASE_URL`, migration scripts)
- Lead REST API (`POST` / `GET` / `PUT` / `DELETE` / `PATCH` endpoints, Zod validation, service layer)
- List sorting (`sortBy` / `sortOrder` on `GET /api/leads`, workflow order for status)
- Backend automated tests (Vitest + Supertest, mocked database `query`; lazy-pool unit tests)
- Frontend foundation (Vite + React + TypeScript shell, API client, env handling)
- Lead list and search UI (TanStack Query, debounced search, `searchBy` controls)
- Create-lead UI (modal, React Hook Form + Zod, mutations)
- Edit-lead UI (shared `LeadForm`, edit modal, update mutation)
- Delete-lead UI (confirmation dialog, delete mutation)
- Lead sorting UI (`LeadSortControls`, sort params in query key and API client)
- Status editing UI (per-row status selector, shared mutation)
- Frontend automated tests (React Testing Library, mocked `leads-api`)
- Backend Vercel / serverless compatibility (`vercel.json`, default Express export, lazy DB pool, `VERCEL` listen guard)
- `README.md` generation and later accuracy-focused refinement (including the final production deployment pass)
- `AGENT.md` (this AI development log), updated for final submission state and reviewed by the developer

Generated code was not treated as final until the developer reviewed it and ran builds/tests.

### ChatGPT

**ChatGPT** was used by the developer as an engineering and planning assistant. It did **not** directly edit files in this repository. Typical uses included:

- Discussing architecture and technology choices aligned with the assignment
- Breaking the work into milestones (backend → database → API → tests → frontend → documentation)
- Reviewing Cursor-generated implementations at a high level
- Helping diagnose build, test, and runtime errors (for example ESM/TypeScript import issues, Vitest mocking patterns, and UI test timing)
- Designing test strategies (mock at the database boundary on the backend; mock API modules on the frontend)
- Drafting focused prompts to paste into Cursor for the next increment
- Reviewing documentation structure and wording for `README.md` / `AGENT.md`
- Discussing engineering trade-offs (simplicity vs. extra abstraction layers)
- Reasoning about Vercel Express deployment constraints (entrypoint export, serverless cold start vs. database pool initialization)

## 3. Development Workflow

The project followed an incremental, review-driven workflow:

1. **Requirement analysis** — Assignment requirements were read and mapped to API endpoints, UI flows, and deliverables (code, tests, README, AI documentation).
2. **Architecture / design planning** — Stack and layering were chosen (see Section 6). ChatGPT assisted with planning; Cursor implemented against concrete prompts.
3. **Repository setup** — The developer created or used the GitHub repository (`Aman-Sigroha/stylework-lead-tracker`), cloned it locally, and initialized the monorepo-style layout (`backend/`, `frontend/`, root metadata).
4. **`.gitignore` before dependencies** — The developer added a root `.gitignore` (excluding `node_modules/`, `.env`, build output, coverage, and IDE noise) before committing installed dependencies.
5. **Cursor increments** — Each feature area was requested in a narrow prompt (inspect existing code first, no unrelated changes).
6. **Developer review** — The developer read diffs, checked types and behavior against requirements, and rejected or corrected over-engineered or incorrect output.
7. **Verification** — The developer ran `npm run build`, `npm test`, manual API checks (including Postman), and manual UI checks in the browser.
8. **Failure handling** — When tests or builds failed, issues were diagnosed (with ChatGPT where helpful) and fixed in Cursor or by guided follow-up prompts (for example Vitest `vi.hoisted` mocks, `<dialog>` test polyfills, debounced search test timing).
9. **Git commits** — Changes were committed in meaningful steps matching features and tests (see Section 8).
10. **Documentation** — `README.md` and `AGENT.md` were drafted, refined for accuracy against the repo, and finalized with production URLs, deployment notes, edit/delete/sort coverage, and final test counts (committed together on `main` after feature work).
11. **Deployment** — Backend and frontend were deployed to **Vercel** with **Neon PostgreSQL** for production data. Deployment issues on the backend (Express entrypoint, default export, lazy database initialization, TypeScript/`@types/node` on the Vercel build) were addressed in focused commits (see Section 9). Production was verified with `GET /api/health` and by loading the hosted frontend.

AI output was **reviewed and tested** rather than blindly accepted.

## 4. AI-Assisted Prompts and Areas

Major Cursor task areas and outcomes (prompts were summarized instructions, not copied verbatim):

| Stage | Tool | Prompt / Task | Result |
|--------|------|----------------|--------|
| Backend foundation | Cursor | Scaffold Express 5 + TypeScript (ESM), `GET /api/health`, CORS, dotenv, `.env.example`, npm scripts | `backend/src/app.ts`, `index.ts`, `config/env.ts`, health routes, dev/build/start scripts |
| PostgreSQL database foundation | Cursor | Add `pg` pool, `DATABASE_URL`, `db:check` / `db:migrate` scripts, SQL migrations for `leads` | `config/database.ts`, `migrations/001_create_leads.*.sql`, `scripts/db-check.ts`, `db-migrate.ts` |
| Create lead API | Cursor | Implement `POST /api/leads` with Zod body validation and service insert | `create-lead.schema.ts`, `lead.service.ts` `createLead`, controller + route |
| List / search leads | Cursor | Implement `GET /api/leads`, optional `search`, order by `created_at DESC`, cap 100 | `listLeads` in service, query schema, list handler |
| `searchBy` support | Cursor | Add `searchBy`: `all` \| `name` \| `email` \| `phone` with safe SQL fragments | `list-leads-query.schema.ts`, `searchWhereClause` in `lead.service.ts` |
| Update lead status | Cursor | Implement `PATCH /api/leads/:id/status`, UUID param validation, 404 when missing | `update-lead-status.schema.ts`, `updateLeadStatus` in service |
| Backend tests | Cursor | Vitest + Supertest; mock `query` so tests need no live DB | `leads.api.test.ts`, `src/test/mock-query.ts`; extended for PUT/DELETE/sort |
| Lead edit API | Cursor | `PUT /api/leads/:id` full field update, Zod body, 404 when missing | `update-lead.schema.ts`, `updateLead` in service, route + tests |
| Lead delete API | Cursor | `DELETE /api/leads/:id` hard delete, 200 + message | `deleteLead` in service, handler, route + tests |
| Lead edit UI | Cursor | Shared `LeadForm`, edit modal, `useUpdateLeadMutation` | `LeadForm.tsx`, `EditLeadModal.tsx`, `leads-api` `updateLead` |
| Lead delete UI | Cursor | Confirmation dialog before delete | `DeleteLeadDialog.tsx`, `useDeleteLeadMutation` |
| Lead sorting (API + UI) | Cursor | `sortBy` / `sortOrder` on list; status workflow `ORDER BY`; sort controls on page | `lead-list-sort.ts`, list query schema, `LeadSortControls`, `useLeadsQuery` |
| Vercel backend deployment | Cursor / developer | Express on Vercel: `vercel.json`, default app export, lazy pool, listen only when not on Vercel | `backend/vercel.json`, `index.ts`, `app.ts`, `database.ts`, `database.test.ts`, `package.json` / `tsconfig.json` tweaks |
| Backend tests (final) | Cursor / developer | Expanded API + lazy pool tests | **45** tests (`leads.api.test.ts`, `database.test.ts`) |
| Frontend foundation | Cursor | Vite React shell, `VITE_API_BASE_URL`, shared fetch client, TanStack Query provider | `lib/api-client.ts`, `lib/env.ts`, `App.tsx`, `main.tsx` |
| Lead list / search UI | Cursor | List with loading/empty/error, debounced search (~300ms), `searchBy` selector | `LeadTrackerPage`, `LeadSearchControls`, `useLeadsQuery`, `useDebouncedValue` |
| Create lead UI | Cursor | Modal + form, RHF + Zod, create mutation and cache invalidation | `CreateLeadModal`, `CreateLeadForm`, `useCreateLeadMutation`, form schema |
| Status editing UI | Cursor | Per-row status `<select>`, single update mutation, error handling | `LeadStatusSelect`, `useUpdateLeadStatusMutation` |
| Frontend tests | Cursor | RTL tests for page flows with mocked `leads-api` | `LeadTrackerPage.test.tsx`, `src/test/setup.ts`; extended for edit, delete, sort |
| Frontend tests (final) | Cursor / developer | Page flows with mocked `leads-api` | **45** tests (`LeadTrackerPage.test.tsx`) |
| README generation / refinement | Cursor | Submission README; passes to align commands, API, structure, tests, and deployment with the repo | Root `README.md` (accuracy review against `package.json` and source) |
| AI development log | Cursor | Document AI usage, workflow, and engineering decisions for submission | Root `AGENT.md` (this file; final update for shipped features and deployment) |

**Recurring constraints given to Cursor** (paraphrased):

- Inspect existing code and directory structure before changing anything
- Do not invent files, endpoints, or architecture not required by the assignment
- Do not modify unrelated code when implementing a single feature
- Reuse existing types and `LEAD_STATUSES` constants
- Use parameterized SQL (`$1`, `$2`, …); never concatenate user input into SQL
- Keep layering simple (routes → controllers → services → `query`)
- Avoid over-engineering (no repository layer for this scope)
- Preserve existing behavior when extending features
- Run or rely on tests before treating work as complete
- Do not commit secrets or document real `.env` values

## 5. AI-Generated vs Developer-Written / Configured Work

### AI-assisted / generated

Cursor generated or substantially assisted with:

- TypeScript backend project structure and Express wiring
- Route, controller, and service modules for leads and health
- Zod schemas for create body, list query (`search` / `searchBy` / `sortBy` / `sortOrder`), full lead update body, status update, and UUID params
- PostgreSQL pool configuration (lazy initialization), SSL handling for hosted URLs, and migration SQL (`001_create_leads`)
- Backend Vitest + Supertest suite with mocked `query`; `database.test.ts` for lazy pool behavior
- `backend/vercel.json` and Express entry changes for Vercel (`default` export, conditional `listen`)
- React feature module under `frontend/src/features/leads/` (page, components including `LeadForm`, edit/delete/sort UI, hooks, API module, CSS)
- Shared frontend utilities (`api-client`, query client, error helpers, date formatting)
- Frontend Vitest + React Testing Library suite with mocked API boundaries
- Initial and refined `README.md` content

Not every line was written by AI in one shot; some edits were iterative after test failures or developer feedback.

### Developer-written / configured / reviewed

The developer owned and performed:

- GitHub repository creation, remote configuration, and clone workflow
- Local `npm install` in `backend/` and `frontend/`
- Root `.gitignore` and decision to keep `.env` out of version control
- Neon PostgreSQL project setup and **local** `DATABASE_URL` configuration (values never committed)
- Verifying Neon PostgreSQL connectivity using the backend database connection check
- Applying and verifying the `001_create_leads` migration locally with `npm run db:migrate` / `db:check` against the developer’s Neon `DATABASE_URL` (not committed)
- Manual API verification (e.g. Postman) for create, list, search, `searchBy`, sort, update, delete, and status update
- Vercel project setup (separate frontend and backend projects), production `DATABASE_URL`, `CORS_ORIGIN`, and `VITE_API_BASE_URL` configuration (values never committed)
- Running backend/frontend builds and automated tests; interpreting failures
- Reviewing, correcting, or re-prompting Cursor when output was wrong or too broad
- Choosing what to accept (e.g. plain CSS, 100-row cap, mock boundaries for tests)
- Creating Git commits with descriptive messages (see Section 8)
- Production deployment to Vercel and verification of the live API and UI
- Final judgment on submission readiness

Overall characterization: **AI-assisted implementation, developer-reviewed and developer-verified.**

## 6. Engineering Decisions

### Stack

| Area | Choice | Rationale (assignment scope) |
|------|--------|------------------------------|
| Frontend | React + TypeScript, Vite | Modern SPA toolchain required by brief; fast dev server and TS safety |
| Server state | TanStack Query | Caching, refetch, and mutations for list/create/edit/delete/status/sort without manual fetch state everywhere |
| Forms | React Hook Form + Zod | Client validation aligned with backend rules for create- and edit-lead (`LeadForm`) |
| Backend | Node.js + Express + TypeScript (ESM) | Simple JSON API; matches full-stack JS expectations |
| Database | PostgreSQL via `pg` | Relational model, constraints, and indexed search |
| Validation | Zod (backend v4; frontend v3) | Shared pattern for request/query/body validation at API boundary and in forms |
| Tests | Vitest, Supertest, React Testing Library | Fast unit/integration-style tests; Supertest for HTTP; RTL for UI behavior |

`react-router-dom` is listed in `frontend/package.json` but the app is a **single page** (`App.tsx` renders `LeadTrackerPage` only).

### Database

PostgreSQL was chosen because lead records are structured (name, email, optional phone, status, timestamps) and benefit from **constraints and indexes** rather than ad hoc file storage.

Implemented in `backend/migrations/001_create_leads.up.sql` and used via parameterized queries:

- **UUID** primary key (`gen_random_uuid()`)
- **Required** `name`, `email`; optional `phone`
- **`status`** with `CHECK` constraint matching `LEAD_STATUSES`
- **`created_at` / `updated_at`** (`TIMESTAMPTZ`, defaults `NOW()`)
- **`updated_at` trigger** (`set_updated_at` on `BEFORE UPDATE`)
- **Indexes** on `status`, `email`, and `created_at DESC`
- **Parameterized SQL** in `lead.service.ts` for insert, list, search, sort, full update, delete, and status update

No performance benchmarks were run; design choices are structural, not benchmark-driven.

### Backend architecture

```
HTTP → routes → controllers → services → query() → PostgreSQL
```

- **Routes** (`health.routes.ts`, `lead.routes.ts`) map paths only.
- **Controllers** parse/validate with Zod and map HTTP status codes.
- **Services** contain SQL and domain mapping (camelCase API types).

A separate **repository** layer was intentionally omitted to keep the assignment codebase small and readable; services call `query()` directly.

### Search

- **Server-side** filtering in PostgreSQL (not client-side filtering of unbounded lists)
- **Case-insensitive** `ILIKE` with `%term%` patterns passed as **parameters**
- **`searchBy`**: `all` (name, email, phone), or `name`, `email`, `phone` only
- **Fixed SQL fragments** per `searchBy` value in code (not user-controlled column names)
- **100-row cap** (`LIST_LEADS_MAX_RESULTS`) on list and search results
- Empty or whitespace-only `search` returns the normal capped list; `searchBy` applies only when `search` is non-empty

### Sorting

- **Server-side** `ORDER BY` in PostgreSQL (whitelist in `lead-list-sort.ts`; no user-controlled column names)
- **`sortBy`**: `name`, `email`, or `status`; omitted → default `created_at DESC`
- **`sortOrder`**: `asc` or `desc`; defaults to `desc` when `sortBy` is set and `sortOrder` is omitted
- **`status` sort** uses a fixed `CASE` expression for pipeline order (`new` → `contacted` → `qualified` → `converted` → `lost`), not alphabetical status strings
- Name/email/status sorts use `created_at DESC` as a tiebreaker

### Edit and delete

- **`PUT /api/leads/:id`** updates name, email, optional phone, and optional status in one request
- **`DELETE /api/leads/:id`** performs a **hard delete** (row removed from `leads`; no soft-delete or undo)
- UI: edit opens a modal with the same fields as create; delete requires explicit confirmation in a dialog

### Frontend architecture

- **Feature folder** `features/leads/` colocates page, components, hooks, API, and styles
- **Shared** `lib/api-client.ts` for fetch + JSON error handling
- **TanStack Query** for `useLeadsQuery` (including sort params in the query key), create/update/delete/status mutations
- **React Hook Form + Zod** for create- and edit-lead modals via shared `LeadForm`
- **Plain CSS** (feature-scoped and global `index.css`) — no component library
- **Single-page UI** — search, sort, table, create/edit modals, delete confirmation, inline status edits on one screen

### Testing

| Layer | Approach | Live Neon required? |
|-------|----------|---------------------|
| Backend | Vitest + Supertest against `createApp()`; `vi.mock` on `config/database.js` `query`; `database.test.ts` for lazy pool (no `DATABASE_URL` at import) | **No** |
| Frontend | Vitest + jsdom + RTL; `vi.mock` on `leads-api`; dialog polyfill in `src/test/setup.ts` | **No** |

**Counts (re-checked on final `main`):** backend **45** passed; frontend **45** passed.

This keeps CI/local test runs deterministic without storing database credentials in the test suite.

## 7. Validation and Security-Related Decisions

Implemented safeguards (appropriate for a local/dev assignment, **not** a full production security audit):

| Measure | Implementation |
|---------|----------------|
| Request validation | Zod on create body, list query, full update body, status body, UUID path param |
| SQL injection mitigation | Parameterized queries only; search scope via fixed switch branches |
| Safe API errors | `400` validation with `details`; generic `500` messages; no stack traces in JSON responses |
| Malformed JSON | Express error handler returns `400` / `Invalid JSON body` |
| Secrets | Real credentials in local `.env` only; `.gitignore` excludes `.env`; `.env.example` templates without secrets |
| Auth | **Not implemented** — API is open in dev; production would need auth before public exposure |

## 8. Git Commit Strategy

Development used **incremental commits** (one broad “big bang” commit was avoided after initial setup). On `main`, the **newest commit** updates `README.md` and `AGENT.md` for the final submission (live demo URL, deployment checklist, production verification, and this AI log). Feature and deployment-fix history below (newest feature commit first, then earlier work):

| Commit (short) | Subject |
|----------------|---------|
| *(latest docs commit on `main`)* | docs: update README and AGENT for final submission |
| `dec2160` | feat: add lead sorting |
| `34c6166` | feat: add lead deletion UI |
| `74e4397` | feat: add lead editing UI |
| `19fe0c2` | feat: add lead delete API |
| `b2f34b2` | feat: add lead edit API |
| `76ed31d` | fix: export Express app for Vercel |
| `c091236` | fix: lazy initialize database pool for serverless |
| `fd968f0` | fix: remove explicit Node type resolution |
| `35de594` | fix: make Node types available to Vercel |
| `d515795` | fix: include node types for Vercel runtime |
| `84453df` | fix: configure Vercel Express build |
| `4d671eb` | fix: configure Express deployment on Vercel |
| `ee809b1` | fix: prepare backend for Vercel deployment |
| `bc252e4` | docs: document AI-assisted development |
| `87a1ce0` | docs: add project documentation |
| `6770728` | test: add frontend component coverage |
| `033bb3f` | feat: add lead status editing |
| `6c09700` | feat: add create lead UI |
| `bfac5f4` | feat: add lead list and search UI |
| `f99ed43` | feat: add frontend foundation |
| `bcd2937` | test: add backend API coverage |
| `acc5982` | feat: add lead status update |
| `144021f` | feat: add lead listing and search |
| `47b27d4` | feat: implement lead creation API |
| `f7e8b96` | feat: add PostgreSQL database foundation |
| `a1b6f19` | feat: add backend foundation |
| `1860631` | Initialize full-stack project |
| `258835d` | Initial commit |

This sequence mirrors backend → database → core API → tests → frontend → initial documentation → Vercel backend fixes → edit/delete/sort features → **final documentation** (`README.md` live demo and deployment sections; `AGENT.md` aligned with shipped behavior and verification). Use `git log -1` on `main` for the exact hash and message of the latest docs commit.

## 9. Testing and Verification

Verification performed during development (automated counts re-checked when this document was finalized):

| Activity | Notes |
|----------|--------|
| Backend `npm run build` | TypeScript compile to `dist/` |
| Backend `npm test` | **45** tests passed (`leads.api.test.ts`, `config/database.test.ts`) |
| Frontend `npm test` | **45** tests passed (`LeadTrackerPage.test.tsx`) |
| Frontend `npm run build` | `tsc -b && vite build` |
| Neon connectivity | Verified against Neon using the backend database connection check with the local `DATABASE_URL` |
| Migrations (local) | Applied and verified `001_create_leads.up.sql` with `npm run db:migrate` / `db:check` against the developer’s Neon instance via local `DATABASE_URL` |
| Production database | Not verified by re-running migration scripts from this repo against production credentials. The production API successfully serves `GET /api/leads` with `200` and lead records, which shows the Neon database behind the Vercel `DATABASE_URL` has a working `leads` table |
| Manual API testing | Postman (or equivalent) against local backend; production checks after deploy (e.g. health and list endpoints) |
| Manual UI testing | Browser against Vite dev server + local API; production UI at the hosted frontend URL |

### Production deployment

| Item | Value |
|------|--------|
| **Frontend (live demo)** | https://stylework-lead-tracker.vercel.app |
| **Backend API base** | https://stylework-lead-tracker-backend.vercel.app/api |
| **Database** | Neon PostgreSQL (`DATABASE_URL` on the backend Vercel project) |

These URLs are documented in `README.md` and were **verified** by:

- `GET https://stylework-lead-tracker-backend.vercel.app/api/health` → `{"success":true,"message":"API is healthy"}` (does not use the database)
- `GET https://stylework-lead-tracker-backend.vercel.app/api/leads` → `200` with `{ "success": true, "data": [ ... ] }` (uses the production database)
- Loading https://stylework-lead-tracker.vercel.app and confirming the page title **Lead Tracker \| Stylework**

Vercel project settings (not committed) hold `DATABASE_URL`, `CORS_ORIGIN`, and the frontend `VITE_API_BASE_URL` used at build time.

### Vercel backend troubleshooting (what actually changed in Git)

Issues encountered while deploying the Express backend to Vercel, and the fixes recorded in commits `ee809b1` through `76ed31d` (plus related TypeScript dependency tweaks):

1. **Express entrypoint / serverless import** — Vercel’s Express integration imports the app as a module instead of running a long-lived `listen()` process. `backend/src/index.ts` now **exports the Express app as default**, calls `app.listen` only when the file is executed directly **and** `process.env.VERCEL !== '1'`, so local `npm run dev` / `npm start` behavior is unchanged.
2. **Default export requirement** — Vercel’s Express preset expects a **default-exported** application instance. `backend/src/app.ts` exports `default app` from `createApp()` in addition to the named `createApp` export used in tests.
3. **Lazy database initialization** — An eager `pg` pool at module import forced `DATABASE_URL` during cold start and could fail before routes ran. `backend/src/config/database.ts` now creates the pool on **first** `query()` / pool access (via `getPool()` and a `Proxy` for `pool`). `GET /api/health` remains usable without a database. `backend/src/config/database.test.ts` asserts import without `DATABASE_URL` does not throw.
4. **`backend/vercel.json`** — Added with `"framework": "express"`; `buildCommand` set to a no-op echo so Vercel’s Express build path is used (`84453df` adjusted `buildCommand` from `null` to the echo string).
5. **TypeScript / `@types/node` on Vercel** — Build failures related to Node types were addressed by moving `@types/node` to **dependencies** (`35de594`) and removing an explicit `"types": ["node"]` from `backend/tsconfig.json` (`fd968f0`), so the Vercel TypeScript compile can resolve Node types during deployment.

Frontend deployment uses a separate Vercel project (Vite static output); there is no `frontend/vercel.json` in the repository—project settings are configured in the Vercel dashboard.

## 10. Limitations / Future Work

Current limitations (by design or not yet implemented):

- No **authentication** or **authorization**
- No **pagination UI** (backend caps at 100 rows per request; sorting is server-side within that cap)
- No **audit trail** for status or field changes
- No advanced filters (e.g. by status or date range) beyond text search
- **Hard delete** only — deleted leads are not recoverable from the UI
- Optional dependency `react-router-dom` unused until multi-route navigation is needed

These items are not presented as shipped features.

## 11. AI Usage Principle

AI tools (primarily **Cursor** for code, **ChatGPT** for planning and review support) acted as **engineering assistants**. The developer remained responsible for interpreting requirements, choosing and validating architecture, reviewing generated code, running tests and manual checks, debugging failures, maintaining Git history, configuring external services (GitHub, Neon), and deciding what to submit. The submitted repository reflects **collaborative, verified development**—neither “fully manual” nor “fully autonomous AI”—with transparency documented here for reviewers.
