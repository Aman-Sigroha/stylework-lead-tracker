# AI-Assisted Development Log

## 1. Purpose

This document records how AI tools were used while building the **Stylework Lead Tracker** for the Stylework Junior Full Stack Engineer assignment. The assignment explicitly permitted and encouraged the use of AI-assisted development tools; this log explains which tools were used, for what tasks, and how the developer remained responsible for review, testing, and final decisions.

It complements `README.md` (technical overview) and is intended for reviewers who want transparency about AI involvement without overstating or understating it.

## 2. AI Tools Used

### Cursor

**Cursor** was the primary AI-assisted coding environment. Implementation work was delivered in focused increments through Cursor Agent sessions, including:

- Backend scaffolding (Express 5, TypeScript ESM, health route, app wiring)
- PostgreSQL integration (`pg` pool, `DATABASE_URL`, migration scripts)
- Lead REST API (`POST` / `GET` / `PATCH` endpoints, Zod validation, service layer)
- Backend automated tests (Vitest + Supertest, mocked database `query`)
- Frontend foundation (Vite + React + TypeScript shell, API client, env handling)
- Lead list and search UI (TanStack Query, debounced search, `searchBy` controls)
- Create-lead UI (modal, React Hook Form + Zod, mutations)
- Status editing UI (per-row status selector, shared mutation)
- Frontend automated tests (React Testing Library, mocked `leads-api`)
- `README.md` generation and later accuracy-focused refinement
- `AGENT.md` (this AI development log), drafted from repository and Git history and reviewed by the developer

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
10. **Documentation** — `README.md` was drafted and refined for accuracy against the repo; this `AGENT.md` documents AI usage for submission.
11. **Deployment** — Production deployment and a live demo URL were **not** completed at the time this document was written; `README.md` lists **Live Demo: TBD**.

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
| Backend tests | Cursor | Vitest + Supertest; mock `query` so tests need no live DB | `leads.api.test.ts`, `src/test/mock-query.ts` (19 tests) |
| Frontend foundation | Cursor | Vite React shell, `VITE_API_BASE_URL`, shared fetch client, TanStack Query provider | `lib/api-client.ts`, `lib/env.ts`, `App.tsx`, `main.tsx` |
| Lead list / search UI | Cursor | List with loading/empty/error, debounced search (~300ms), `searchBy` selector | `LeadTrackerPage`, `LeadSearchControls`, `useLeadsQuery`, `useDebouncedValue` |
| Create lead UI | Cursor | Modal + form, RHF + Zod, create mutation and cache invalidation | `CreateLeadModal`, `CreateLeadForm`, `useCreateLeadMutation`, form schema |
| Status editing UI | Cursor | Per-row status `<select>`, single update mutation, error handling | `LeadStatusSelect`, `useUpdateLeadStatusMutation` |
| Frontend tests | Cursor | RTL tests for page flows with mocked `leads-api` | `LeadTrackerPage.test.tsx`, `src/test/setup.ts` (26 tests) |
| README generation / refinement | Cursor | Submission README; later pass to align commands, API, structure, and tests with the repo | Root `README.md` (accuracy review against `package.json` and source) |
| AI development log | Cursor | Document AI usage, workflow, and engineering decisions for submission | Root `AGENT.md` (this file) |

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
- Zod schemas for create body, list query (`search` / `searchBy`), status update, and UUID params
- PostgreSQL pool configuration, SSL handling for hosted URLs, and migration SQL (`001_create_leads`)
- Backend Vitest + Supertest suite with mocked `query`
- React feature module under `frontend/src/features/leads/` (page, components, hooks, API module, CSS)
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
- Applying and verifying the `001_create_leads` migration against Neon PostgreSQL
- Manual API verification (e.g. Postman) for create, list, search, `searchBy`, and status update
- Running backend/frontend builds and automated tests; interpreting failures
- Reviewing, correcting, or re-prompting Cursor when output was wrong or too broad
- Choosing what to accept (e.g. plain CSS, 100-row cap, mock boundaries for tests)
- Creating Git commits with descriptive messages (see Section 8)
- Final judgment on submission readiness and pending deployment

Overall characterization: **AI-assisted implementation, developer-reviewed and developer-verified.**

## 6. Engineering Decisions

### Stack

| Area | Choice | Rationale (assignment scope) |
|------|--------|------------------------------|
| Frontend | React + TypeScript, Vite | Modern SPA toolchain required by brief; fast dev server and TS safety |
| Server state | TanStack Query | Caching, refetch, and mutations for list/create/status without manual fetch state everywhere |
| Forms | React Hook Form + Zod | Client validation aligned with backend rules for create-lead |
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
- **Parameterized SQL** in `lead.service.ts` for insert, list, search, and status update

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

### Frontend architecture

- **Feature folder** `features/leads/` colocates page, components, hooks, API, and styles
- **Shared** `lib/api-client.ts` for fetch + JSON error handling
- **TanStack Query** for `useLeadsQuery`, create mutation, status mutation
- **React Hook Form + Zod** for create-lead modal validation
- **Plain CSS** (feature-scoped and global `index.css`) — no component library
- **Single-page UI** — search, table, create modal, inline status edits on one screen

### Testing

| Layer | Approach | Live Neon required? |
|-------|----------|---------------------|
| Backend | Vitest + Supertest against `createApp()`; `vi.mock` on `config/database.js` `query` | **No** |
| Frontend | Vitest + jsdom + RTL; `vi.mock` on `leads-api`; dialog polyfill in `src/test/setup.ts` | **No** |

This keeps CI/local test runs deterministic without storing database credentials in the test suite.

## 7. Validation and Security-Related Decisions

Implemented safeguards (appropriate for a local/dev assignment, **not** a full production security audit):

| Measure | Implementation |
|---------|----------------|
| Request validation | Zod on create body, list query, status body, UUID path param |
| SQL injection mitigation | Parameterized queries only; search scope via fixed switch branches |
| Safe API errors | `400` validation with `details`; generic `500` messages; no stack traces in JSON responses |
| Malformed JSON | Express error handler returns `400` / `Invalid JSON body` |
| Secrets | Real credentials in local `.env` only; `.gitignore` excludes `.env`; `.env.example` templates without secrets |
| Auth | **Not implemented** — API is open in dev; production would need auth before public exposure |

## 8. Git Commit Strategy

Development used **incremental commits** (one broad “big bang” commit was avoided after initial setup). Observed history on `main` (newest first):

| Commit (short) | Subject |
|----------------|---------|
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

This sequence mirrors backend → database → API features → backend tests → frontend → frontend tests → documentation.

## 9. Testing and Verification

Verification performed during development (automated counts re-checked when this document was written):

| Activity | Notes |
|----------|--------|
| Backend `npm run build` | TypeScript compile to `dist/` |
| Backend `npm test` | **19** tests passed (`leads.api.test.ts`) |
| Frontend `npm test` | **26** tests passed (`LeadTrackerPage.test.tsx`) |
| Frontend `npm run build` | `tsc -b && vite build` |
| Neon connectivity | Verified against Neon using the backend database connection check with the local `DATABASE_URL` |
| Migrations | Applied and verified `001_create_leads.up.sql` against Neon PostgreSQL |
| Manual API testing | Postman (or equivalent) against local backend |
| Manual UI testing | Browser against Vite dev server + local API |
| Deployment | **Not complete** — no production URL; README **Live Demo: TBD** |

## 10. Limitations / Future Work

Current limitations (by design or not yet implemented):

- No **authentication** or **authorization**
- No **pagination UI** (backend caps at 100 rows per request)
- No **audit trail** for status changes
- No advanced filters (e.g. by status or date range) beyond text search
- **Production deployment** still pending at the time this document was written
- Optional dependency `react-router-dom` unused until multi-route navigation is needed

These items are not presented as shipped features.

## 11. AI Usage Principle

AI tools (primarily **Cursor** for code, **ChatGPT** for planning and review support) acted as **engineering assistants**. The developer remained responsible for interpreting requirements, choosing and validating architecture, reviewing generated code, running tests and manual checks, debugging failures, maintaining Git history, configuring external services (GitHub, Neon), and deciding what to submit. The submitted repository reflects **collaborative, verified development**—neither “fully manual” nor “fully autonomous AI”—with transparency documented here for reviewers.
