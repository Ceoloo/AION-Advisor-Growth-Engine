# 01 — Repository Inventory

## REPOSITORY: AION-Advisor-Growth-Engine

| Field | Value |
| --- | --- |
| REPOSITORY | `Ceoloo/AION-Advisor-Growth-Engine` |
| PATH | `/home/user/AION-Advisor-Growth-Engine` |
| GIT REMOTE | `https://github.com/Ceoloo/AION-Advisor-Growth-Engine` |
| BRANCH | `claude/aion-p0d-forensics-ui8i8u` (working branch); default appears to be `main`/base |
| COMMIT | `549ed6de64a874624f16d7b0657dc71314f98635` |
| FRAMEWORK | Next.js (App Router) + TypeScript; Turborepo + pnpm workspaces monorepo |
| RUNTIME | Node ≥ 20 (`package.json` engines); Vercel serverless (web), Node HTTP (api), long-running Node (worker) |
| PACKAGE MANAGER | pnpm `10.33.0` (`package.json:8`); `pnpm-workspace.yaml`, `pnpm-lock.yaml` |
| LANGUAGE | TypeScript 5.7; SQL (Postgres 16); JSON workflow definitions |
| SOURCE FILES | 236 (`.ts/.tsx/.js/.sql/.yml/.yaml/.json`, excl. node_modules) |

### Framework / build config
- `turbo.json`, `tsconfig.base.json`, `.prettierrc`, `.husky/` (git hooks), `.env.example`
- Build: `turbo run build`; Web build output `apps/web/.next` (`infrastructure/deployment/vercel.json:6`)

### Major application directories

| Category | Path(s) |
| --- | --- |
| Web app (Next.js) | `apps/web/` — dashboard + API route handlers |
| Standalone API | `apps/api/` — dependency-free Node HTTP service |
| Background worker | `apps/worker/` — workflow-engine runner + heartbeat |
| Docs site placeholder | `apps/docs/` |
| Domain packages | `packages/{ai,analytics,auth,compliance,config,database,ghl,integrations,scorecard,shared,types,ui,workflows}` |
| Supabase (schema) | `infrastructure/migrations/` (0001–0010 SQL), `infrastructure/supabase/config.toml` |
| Edge Functions | **NONE** — no `supabase/functions/` directory exists |
| API directories | `apps/web/src/app/api/*`, `apps/api/src/*` |
| Workflow directories | `packages/workflows/src/definitions/*.json`, `packages/workflows/src/engine.ts` |
| Automation | `apps/worker/src/*` (worker), Vercel cron (`vercel.json`) |
| Infrastructure | `infrastructure/{deployment,docker,migrations,supabase}` |
| Deployment config | `infrastructure/deployment/vercel.json` (Vercel), `infrastructure/docker/docker-compose.yml` (local Postgres+auth shim) |
| Env config (filenames only) | `.env.example`, `packages/shared/src/env.ts` (Zod schema). **No secret values present.** |
| Docs / architecture | `README.md`, `docs/architecture.md`, `docs/database-schema.md`, `docs/ghl-integration.md`, `docs/ai-layer.md`, `docs/workflows.md`, `docs/security.md`, `docs/scorecard.md`, `docs/deployment.md`, `docs/api-reference.md` |
| Agent/runtime dirs | **NONE** — no agent-runtime directory (no OpenClaw/Hermes/agent-loop code). `@aion/ai` gateway is the only "AI runtime" (provider-agnostic, mock default) |

### Structured inventory block

```
REPOSITORY            AION-Advisor-Growth-Engine
PATH                  /home/user/AION-Advisor-Growth-Engine
BRANCH                claude/aion-p0d-forensics-ui8i8u
COMMIT                549ed6de64a874624f16d7b0657dc71314f98635
FRAMEWORK             Next.js App Router + Turborepo (pnpm) monorepo
RUNTIME               Node >=20 (Vercel serverless / Node HTTP / worker)

ENTRYPOINTS
  - apps/web/src/app/**/page.tsx        (Next.js pages: dashboard + advisor-scorecard funnel)
  - apps/web/src/app/api/**/route.ts    (9 API route handlers)
  - apps/api/src/index.ts               (standalone HTTP API; 4 routes)
  - apps/worker/src/index.ts            (worker: runOnce + setInterval heartbeat)
  - scripts/seed-demo.ts                (demo seed CLI)

EDGE_FUNCTIONS
  - NONE (no supabase/functions). "Edge" compute = Next.js API routes on Vercel.

API_ROUTES (apps/web/src/app/api)
  - GET  /api/health
  - POST /api/ai/advisor-brief
  - POST /api/ai/qualify
  - GET  /api/demo-control
  - POST /api/demo-control
  - POST /api/scorecard/submit
  - POST /api/scorecard/event
  - POST /api/scorecard/brief
  - POST /api/scorecard/booking-confirmed
  - POST /api/webhooks/ghl
API_ROUTES (apps/api/src/index.ts)
  - GET  /health
  - POST /leads/score
  - POST /ai/qualify
  - POST /webhooks/ghl

WORKERS
  - apps/worker/src/index.ts   (heartbeat setInterval 60s; runOnce runs 2 workflows on seed data)
  - apps/worker/src/handlers.ts (step handlers; mostly no-op logging in skeleton)

CRON_JOBS
  - Vercel cron: GET /api/health every */15 * * * *  (infrastructure/deployment/vercel.json:7-12)
  - Worker heartbeat: setInterval(60_000) (apps/worker/src/index.ts:53)
  - NO pg_cron (grep=0). NO EventBridge/Lambda/SQS/SNS (grep=0).

WEBHOOKS
  - INBOUND GHL webhook: POST /api/webhooks/ghl (verify HMAC + idempotency + log)
  - INBOUND GHL webhook: POST /webhooks/ghl (apps/api mirror)
  - OUTBOUND booking confirmation sink: POST /api/scorecard/booking-confirmed
    (intended target of a scheduler tool's redirect/webhook)

DATABASE_CODE
  - infrastructure/migrations/0001-0010 SQL (~61 tables, 4 functions, RLS, triggers)
  - packages/database/src/client.ts  (Supabase client factory — STUB, not wired)
  - packages/database/src/demo/*     (in-memory demo store — the ACTUAL runtime data)
  - packages/database/src/pipelines.ts (pipeline templates)
  - NO live supabase.from()/.rpc() anywhere (grep=0)

EXTERNAL_INTEGRATIONS
  - Airtable         LIVE-capable WRITE (packages/integrations/src/airtable.ts) — only real outbound
  - GoHighLevel      INBOUND webhook (verify+log); client mocked (packages/ghl/*)
  - OpenAI/Anthropic AI gateway (packages/ai/providers/*) — mock default
  - Booking URL      provider-agnostic (packages/integrations/src/booking.ts)
  - Registry mocks   twilio, telnyx, sendgrid, mailgun, stripe, square, docusign, pandadoc,
                     google_calendar, outlook_calendar, google_drive, dropbox, clearbit,
                     apollo, zapier, make, n8n, carrier_api, quote_platform (all MockAdapter)
  - Observability    Sentry / PostHog (env names only, no client code)

AGENT_SYSTEMS
  - NONE. No OpenClaw/Hermes/agent-loop. @aion/ai gateway is the only AI-runtime abstraction.

DEPLOYMENT_TARGETS
  - Vercel (web) — infrastructure/deployment/vercel.json
  - Supabase (Postgres+Auth+Storage, local via config.toml; migrations applied by CLI)
  - Docker local stack — infrastructure/docker/docker-compose.yml (+ auth shim init SQL)
  - apps/api and apps/worker: deployment target unspecified (generic Node hosts)
```

## Other AION repositories (NOT scanned — out of session scope)

`aion-company-os`, `AION-Revenue-Factory`, `AION-VPS-Empire-Command.V1` were **not present in
this workspace** and GitHub scope was limited to `ceoloo/aion-advisor-growth-engine`. They must
be traced in a separate session that has them attached. No assumptions about their contents are
recorded here.
