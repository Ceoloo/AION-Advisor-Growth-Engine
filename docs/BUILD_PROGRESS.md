# Build Progress

Living record of the AION Advisor Growth Engine build. Updated as milestones land.

## Status: MVP skeleton complete ✅

`pnpm install`, `pnpm dev`, and `pnpm build` all work. The web app is a full
Next.js production build (27 routes). 47 unit tests, 9 integration tests, and 5
Playwright e2e tests pass. The system runs entirely offline on seeded demo data.

## Completed work

### Phase 1 — Foundation
- pnpm + Turborepo monorepo; shared tsconfig/eslint/prettier; validated `.env.example`.
- `@aion/types` (domain types + enums), `@aion/shared` (env validation, structured logging, redaction, errors, utils), `@aion/config`.
- Supabase schema: 10 migrations (~60 tables) covering tenancy, leads, CRM, financial/insurance, documents/compliance, integrations, analytics; RLS on every tenant table; RBAC seed.
- `@aion/auth` (RBAC + tenant guards), `@aion/ui` (component library + tokens).

### Phase 2 — CRM core
- Leads, contacts, pipelines/stages, opportunities, appointments, conversations/messages, notes, tasks — modeled in schema, types, and the demo store.

### Phase 3 — GoHighLevel
- `@aion/ghl`: typed client (retry, rate-limit, logging, error normalization), full service interfaces, webhook verification + idempotency, mock services, factory.

### Phase 4 — Intelligence
- `@aion/ai`: provider-agnostic gateway; mock/OpenAI/Anthropic providers; Zod output schemas; qualification + scoring signals; deterministic scoring engine; engines (qualify, needs, advisor brief, follow-up, conversation summary, next-best-action, compliance check); two qualification templates.

### Phase 5 — Automation
- `@aion/workflows`: declarative engine (retry + approval gates) and six JSON workflow definitions. `@aion/worker` runs them end-to-end (with a real AI advisor brief).

### Phase 6 — Analytics & demo
- `@aion/analytics` (live metric aggregation); `@aion/database` demo seed (2 tenants, 40 leads, deterministic) + tenant-scoped store; `@aion/compliance` (audit, consent, disclosures, demo guard); `@aion/integrations` (adapter registry — GHL live, others mocked).
- `apps/web`: all required routes, executive dashboard, lead list + rich detail page, pipeline board, qualification forms, appointments, analytics, integrations, compliance, workflows, team, settings, and a guided `/demo`. API routes: AI qualify, advisor brief, GHL webhook ingestion, health.
- `apps/api` (standalone service), `apps/worker` (jobs).

### Cross-cutting
- Docs set with Mermaid diagrams (architecture, schema, GHL, AI, workflows, security, compliance, deployment, demo, API).
- Tests: package unit tests + `/tests` integration suite (the 7 critical scenarios) + Playwright e2e.
- Infrastructure: migrations + README, Supabase config, Docker Postgres + auth shim, Vercel config.

## Technical decisions

- **Demo-first architecture.** The whole platform runs offline via the mock AI provider and in-memory `DemoStore`, so it's demonstrable without any external service. The data-access boundary (`apps/web/src/lib/demo.ts`) is the single seam where live Supabase repositories swap in.
- **`.js` ESM specifiers** internal to TS packages, resolved via `transpilePackages` + a webpack `extensionAlias` in Next, and natively by Vite/tsx.
- **Scoring is deterministic and separate from AI** for explainability/auditability.
- **Tenant isolation is enforced twice** — Postgres RLS (hard boundary) and app-layer `assertSameTenant`/`scopeToTenant` (defense in depth).
- **Mock GHL/AI live behind the same interfaces as the real implementations**, so going live requires no caller changes.

## Known limitations

- **Auth is mocked** — the app boots into the demo org. Wire Supabase Auth for real sessions/tenancy resolution.
- **GHL & non-GHL integrations are mocked** — `createGHLServices` returns the mock; other providers are placeholder adapters.
- **Persistence is in-memory in demo mode** — no live Supabase reads/writes yet; the schema and repository seam are ready.
- **Disclosures are placeholders** — must be replaced with counsel-approved copy.
- **Worker uses an in-process engine** — swap for Inngest/Trigger.dev/BullMQ for durable, distributed jobs.
- **Analytics reads operational tables live** — pre-aggregation tables exist but aren't populated yet.

## Next steps

1. Wire Supabase Auth + session-based tenant resolution; replace the demo store with RLS-backed repositories.
2. Implement the live GHL client-backed services and enable real webhook processing → New Lead workflow.
3. Turn on a real AI provider and record usage/cost to `api_usage_logs`.
4. Build document upload/storage with signed URLs and access logging.
5. Add Sentry + PostHog wiring and the observability dashboards.
6. Data retention, export, and deletion-request flows; rate limiting.
7. Legal/compliance review before any production use.
