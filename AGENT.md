# AI-Assisted Development Log

## 1. Purpose

This document records how AI tools were used while building the **Stylework Lead Tracker** for the Stylework Junior Full Stack Engineer assignment. The assignment explicitly permitted and encouraged the use of AI-assisted development tools; this log explains which tools were used, for what tasks, and how the developer remained responsible for review, testing, and final decisions.

It complements `README.md` (technical overview) and is intended for reviewers who want transparency about AI involvement without overstating or understating it.

## 2. AI Tools Used

### Cursor

**Cursor** was the primary AI-assisted coding environment. Implementation work was delivered in focused increments through Cursor Agent sessions, including:

- Backend scaffolding (Express 5, TypeScript ESM, health route, app wiring)
- PostgreSQL integration (`pg` pool, `DATABASE_URL`, migration scripts)
- Lead REST API (CRUD, status patch, Zod validation, service layer)
- Server-side pagination, filtering (`status`, `createdFrom` / `createdTo`), list sorting, and search (`search` / `searchBy`)
- **JWT authentication** — login/logout/me, `bcrypt`, HttpOnly cookie, `requireAuth` on lead routes
- **CSV export** — `GET /api/leads/export.csv` with shared filters (no `page`/`limit`)
- **Excel export** — `GET /api/leads/export.xlsx` (ExcelJS; same filter model as CSV)
- **CSV import** — preview (`multipart` upload) and confirm (transactional insert), row validation, duplicate detection (in-file + database)
- **Migration tracking** — `schema_migrations`, migration runner, bootstrap for legacy DBs, `db:migrate:down` for latest rollback
- Auth cookie `maxAge` fix aligned with JWT expiry
- Frontend **AuthGate** and login flow; credentialed `fetch` API client
- Lead list UI with pagination controls, filters, sort, import/export buttons
- Backend automated tests (Vitest + Supertest; mocked `query`, auth helpers, import/export, migrations)
- Frontend automated tests (RTL; mocked `leads-api`, auth, blob download, import dialog)
- Backend Vercel / serverless compatibility (`vercel.json`, default Express export, lazy DB pool, auth types in build)
- ESLint fixes on `LeadTrackerPage` (pagination/filter effects) and test cleanup
- `README.md` and `AGENT.md` accuracy passes against the final repository state

Generated code was not treated as final until the developer reviewed it and ran builds/tests.

### ChatGPT

**ChatGPT** was used by the developer as an engineering and planning assistant. It did **not** directly edit files in this repository. Typical uses included:

- Discussing architecture and technology choices aligned with the assignment
- Breaking the work into milestones (backend → database → API → auth → pagination → import/export → tests → deployment → documentation)
- Reviewing Cursor-generated implementations at a high level
- Helping diagnose build, test, and runtime errors (ESM/TypeScript, Vitest mocking, credentialed CORS, cookie `sameSite` on Vercel)
- Designing test strategies (mock at the database boundary on the backend; mock API modules on the frontend)
- Drafting focused prompts for Cursor for the next increment
- Reviewing documentation structure and wording for `README.md` / `AGENT.md`
- Discussing trade-offs (pagination vs. client lists, HttpOnly cookies vs. `localStorage`, import duplicate rules without a unique email constraint)
- Reasoning about Vercel Express deployment constraints and environment variables

## 3. Development Workflow

The project followed an incremental, review-driven workflow:

1. **Requirement analysis** — Assignment requirements mapped to API endpoints, UI flows, auth, and deliverables.
2. **Architecture / design planning** — Stack and layering chosen (see Section 6). ChatGPT assisted with planning; Cursor implemented against concrete prompts.
3. **Repository setup** — GitHub repository, monorepo layout (`backend/`, `frontend/`).
4. **`.gitignore` before dependencies** — Root `.gitignore` excluding `node_modules/`, `.env`, build output, and IDE noise.
5. **Cursor increments** — Narrow prompts (inspect existing code first, no unrelated changes).
6. **Developer review** — Diffs read; behavior checked against requirements.
7. **Verification** — `npm run build`, `npm test`, `npm run lint` (frontend), manual API/UI checks.
8. **Failure handling** — Test/build failures diagnosed (with ChatGPT where helpful) and fixed in Cursor.
9. **Git commits** — Meaningful steps matching features and tests (see Section 8).
10. **Documentation** — `README.md` and `AGENT.md` aligned with shipped behavior, production URLs, and verified test counts.
11. **Deployment** — Backend and frontend on **Vercel** with **Neon PostgreSQL**; production health, auth, and lead flows verified.

AI output was **reviewed and tested** rather than blindly accepted.

## 4. AI-Assisted Prompts and Areas

Major Cursor task areas and outcomes (prompts were summarized instructions, not copied verbatim):

| Stage | Tool | Prompt / Task | Result |
|--------|------|----------------|--------|
| Backend foundation | Cursor | Express 5 + TypeScript (ESM), `GET /api/health`, CORS, dotenv | `app.ts`, health routes, env config |
| PostgreSQL foundation | Cursor | `pg` pool, migrations for `leads` | `001_create_leads.*.sql`, `db-check`, `db-migrate` |
| Core lead API | Cursor | Create, list, search, update, delete, status patch | Controllers, services, Zod schemas, tests |
| Pagination & filters | Cursor | `page`/`limit`/`total`/`totalPages`, status and date filters | `list-leads-query.schema.ts`, `listLeads` with COUNT + LIMIT/OFFSET |
| JWT authentication | Cursor | Users table, login/logout/me, HttpOnly cookie, `requireAuth` | `auth.routes.ts`, `auth.service.ts`, `002_create_users`, frontend AuthGate |
| CSV export | Cursor | Authenticated CSV download, filters without pagination | `csv.ts`, `exportLeads`, `LeadExportButton`, blob client |
| Auth cookie lifetime | Cursor | Fix cookie `maxAge` vs JWT `expiresIn` | `auth-cookie.ts` + unit test |
| Excel export | Cursor | `.xlsx` export with ExcelJS | `xlsx.ts`, export route, frontend button |
| CSV import | Cursor | Preview + confirm, multer + csv-parse | `lead-import.service.ts`, import controllers, `LeadImportButton` |
| Duplicate import detection | Cursor | Normalize email; in-file + DB batch check; skip on confirm | Preview `duplicateRows`, transactional re-check |
| Migration tracking | Cursor | `schema_migrations`, runner, bootstrap, migrate down | `migration-runner.ts`, refactored `db-migrate.ts`, tests |
| Vercel backend | Cursor / developer | Express default export, lazy pool, auth types for build | Commits `ee809b1`–`cc8edfe` |
| Frontend lint | Cursor | Remove problematic `useEffect` setState; unused imports | `LeadTrackerPage.tsx`, `App.auth.test.tsx` |
| Final documentation | Cursor | README + AGENT final pass (no app code changes) | Root docs aligned with repo |

**Recurring constraints given to Cursor** (paraphrased):

- Inspect existing code before changing anything
- Do not invent endpoints or features outside the requested increment
- Parameterized SQL only; whitelisted sort/filter columns
- Reuse existing types and `LEAD_STATUSES`
- Run tests before treating work as complete
- Do not commit secrets

## 5. AI-Generated vs Developer-Written / Configured Work

### AI-assisted / generated

Cursor generated or substantially assisted with:

- Backend structure, lead and auth routes, import/export handlers, migration runner
- Zod schemas for bodies, queries, and import payloads
- PostgreSQL migrations (`001` leads, `002` users) and `schema_migrations` tracking
- Vitest + Supertest suites with mocked `query` and auth test helpers
- React features: `features/auth/` (AuthGate, login), `features/leads/` (pagination, filters, import/export, CRUD UI)
- Shared `api-client` (JSON + blob), download helper, TanStack Query hooks
- Frontend Vitest + RTL tests with mocked API boundaries
- `README.md` and `AGENT.md` drafts and refinements

### Developer-written / configured / reviewed

The developer owned and performed:

- GitHub repository, remotes, and clone workflow
- Local `npm install` in `backend/` and `frontend/`
- Root `.gitignore` and keeping `.env` out of version control
- Neon PostgreSQL project and **local** `DATABASE_URL` (never committed)
- Running `db:migrate`, `db:create-admin` against dev/prod Neon as appropriate
- Production Vercel projects: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `VITE_API_BASE_URL`
- Manual API verification (Postman or browser) for auth, pagination, export, import preview/confirm
- Reviewing, correcting, or re-prompting Cursor when output was wrong or too broad
- Git commits with descriptive messages
- Final judgment on submission readiness

Overall: **AI-assisted implementation, developer-reviewed and developer-verified.**

## 6. Engineering Decisions

### Stack

| Area | Choice | Rationale |
|------|--------|-----------|
| Frontend | React + TypeScript, Vite | Modern SPA; fast dev server |
| Server state | TanStack Query | List pagination, mutations, cache invalidation |
| Forms | React Hook Form + Zod | Client validation aligned with API |
| Backend | Node.js + Express + TypeScript (ESM) | JSON REST API |
| Database | PostgreSQL via `pg` | Constraints, indexes, transactional import |
| Auth | JWT + HttpOnly cookie | No token in `localStorage`; credentialed CORS |
| Tests | Vitest, Supertest, RTL | Fast tests; boundary mocking |

The app is a **single routed experience**: `App.tsx` renders `AuthGate` (login or `LeadTrackerPage`).

### Database

- **`leads`** — UUID PK, name/email/phone/status, timestamps, indexes (email not globally UNIQUE)
- **`users`** — admin credentials (`password_hash`)
- **`schema_migrations`** — applied migration versions; runner applies pending `.up.sql` in transactions

### Backend architecture

```
HTTP → routes → controllers → services → query() → PostgreSQL
         ↑ requireAuth (leads)
```

Import/export reuse list filter/sort building where applicable; export omits pagination limits.

### Search, filters, pagination, sorting

- **Server-side** search (`ILIKE`), `searchBy`, `status`, `createdFrom`/`createdTo`
- **Pagination** — default `page=1`, `limit=20`, max `limit=100`; response includes `total` and `totalPages`
- **Sorting** — whitelist `sortBy` / `sortOrder`; status uses workflow `CASE` order

### Authentication

- Login sets HttpOnly `auth_token`; logout clears it; `/me` validates session
- No public signup; `npm run db:create-admin` provisions admin
- All `/api/leads*` routes require authentication

### CSV import / export

- **Export** — authenticated; same filters/sort as list; all matching rows
- **Import** — two-step preview (no DB writes) then confirm; Zod per row; duplicates excluded from insert (preview and confirm re-check)

### Testing

| Layer | Approach | Live Neon required? |
|-------|----------|---------------------|
| Backend | Vitest + Supertest; mock `query`; auth/import/migration tests | **No** |
| Frontend | Vitest + jsdom + RTL; mock `leads-api` / auth / blob | **No** |

**Counts (verified on final documentation pass):** backend **150** passed (16 files); frontend **93** passed (7 files).

## 7. Validation and Security-Related Decisions

| Measure | Implementation |
|---------|----------------|
| Request validation | Zod on bodies, queries, import payloads, UUID params |
| SQL injection mitigation | Parameterized queries; fixed fragments for search/sort |
| Authentication | JWT in HttpOnly cookie; `requireAuth` on lead routes |
| CORS | Credentialed requests; `CORS_ORIGIN` in production |
| Secrets | `.env` gitignored; JWT and DB URL only in environment |
| Import limits | File size and row limits enforced server-side |
| Passwords | `bcrypt` hashes in `users`; never returned in API |

This is appropriate for an assignment scope, not a full production security audit (no rate limiting, no RBAC beyond single admin).

## 8. Git Commit Strategy

Incremental commits on `main`. Newest feature and fix history (documentation commit for this pass is local until the developer commits):

| Commit | Subject |
|--------|---------|
| `b9eb06e` | fix: track applied database migrations |
| `e12665e` | feat: prevent duplicate lead imports |
| `f27dfc1` | feat: add CSV lead import |
| `c90ea97` | feat: add formatted Excel lead export |
| `e174984` | fix: align auth cookie lifetime with JWT expiration |
| `8c309fb` | feat: add lead CSV export |
| `cc8edfe` | fix: include auth request types in Vercel build |
| `5b75c34` | feat: add JWT authentication |
| `2ec60d8` | feat: add pagination and lead filters |
| `62b7f4c` | fix: resolve frontend lint error |
| `70c96e2` | docs: update README and AGENT for final submission |
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

Earlier history includes frontend foundation, core API, and initial tests (`1860631` initial full-stack setup through `f99ed43` frontend foundation). Use `git log` for the full graph.

## 9. Testing and Verification

Verification on the final documentation pass:

| Activity | Result |
|----------|--------|
| Backend `npm test` | **150** passed |
| Backend `npm run build` | Success (`tsc`) |
| Frontend `npm test` | **93** passed |
| Frontend `npm run build` | Success (`tsc -b && vite build`) |
| Frontend `npm run lint` | Success (0 errors) |
| Neon (local) | `db:check`, `db:migrate`, `db:create-admin` against developer Neon |
| Manual / production | Health endpoint; hosted frontend login and lead flows |

### Production deployment

| Item | Value |
|------|--------|
| **Frontend (live demo)** | https://stylework-tracker.vercel.app |
| **Backend API base** | https://stylework-lead-tracker-backend.vercel.app/api |
| **Database** | Neon PostgreSQL (`DATABASE_URL` on backend Vercel project) |

Verified in prior passes and documented in `README.md`:

- `GET .../api/health` — healthy without database
- Authenticated lead list, export, and UI at the hosted frontend URL

**Vercel environment (backend):** `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`. Do not set `PORT` / `NODE_ENV` for Vercel unnecessarily.

**Vercel environment (frontend):** `VITE_API_BASE_URL` pointing at the production API `/api` prefix.

### Vercel backend troubleshooting (Git-recorded fixes)

Commits `ee809b1` through `cc8edfe` addressed:

1. Default-exported Express app for serverless import
2. Conditional `listen()` when not on Vercel
3. Lazy `pg` pool so health works without DB at import time
4. `vercel.json` with Express framework preset
5. `@types/node` / `tsconfig` adjustments for Vercel TypeScript builds
6. Auth-related Express types included in production compile

## 10. Limitations / Future Work

Genuine remaining limitations (implemented items such as auth, pagination, filters, CSV import/export, and migration tracking are **not** listed here):

- No self-service signup or multi-role authorization
- No audit trail for field or status changes
- No rate limiting or in-repo observability stack
- `leads.email` is not globally unique (manual duplicates allowed; import has separate duplicate rules)
- Optional CI workflow not included in the repository
- `react-router-dom` is a dependency but unused (single-page AuthGate flow)

## 11. AI Usage Principle

AI tools (primarily **Cursor** for code, **ChatGPT** for planning and review support) acted as **engineering assistants**. The developer remained responsible for interpreting requirements, validating architecture, reviewing generated code, running tests and manual checks, configuring GitHub/Neon/Vercel, and deciding what to submit. The repository reflects **collaborative, verified development** with transparency documented here for reviewers.
