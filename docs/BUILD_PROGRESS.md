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

## Pilot presentation mode (Ben Peretz)

Presentation-layer customization on top of the approved foundation — no new
architecture, providers, or databases.

- Demo org customized to **Ben Peretz — Financial Protection & Planning** (solo
  advisor practice); all leads route to Ben.
- **Marcus Johnson** scripted journey injected deterministically into the demo
  store: Financial Protection Checkup entry → contact + 3 consents → completed
  qualification → deterministic **score 86** (high priority, computed by the
  same engine, guarded by tests to stay in 80–88) → tags → personalized
  education → CRM lead → pipeline movement → simulated follow-up (no send) →
  booked appointment → AI advisor brief → dashboard update.
- **`/presentation`** hub with 12 sequential stage buttons + a stage viewer
  (`/presentation/stage/[step]`) with Prev/Next and live-screen deep links.
- **`/demo-control`** (+ `/api/demo-control`): reset Marcus, seed at any stage,
  disable external sending, restore demo state (in-memory, process-local).
- **`/presentation/pricing`** (Pilot $4,500 + $997/mo; Growth $7,500 + $1,497/mo)
  and **`/presentation/checklist`** (9 pre-launch sign-offs).
- 20 **backup screenshots** of every critical stage
  (`docs/presentation/screenshots`) + the run-of-show in
  `docs/presentation-sequence.md`.
- Fully offline, mobile + desktop, under five minutes. Live GoHighLevel, AI,
  messaging, and production auth remain disconnected until the pilot is approved.

## Advisor Conversion Scorecard (Client Zero acquisition funnel)

Added as an extension of the existing app — no new framework, database, or auth.
See `docs/scorecard.md`.

- **`@aion/scorecard`** (new pure package): 18-question bank, deterministic
  0–100 scoring (six sections 15/15/20/20/15/15), bands, normalized primary-leak
  with systemic-tie handling, deterministic findings/first-fix/30-day-plan,
  intent-points config, internal Advisor Brief generator, and a deterministic
  Marcus Johnson demo (57 / Conversion Gaps). 29 unit tests.
- **Airtable integration** in `@aion/integrations` (`airtable.ts`): server-side
  client mapped to the real "Revenue & CRM OS" base schema (Leads, Advisor
  Scorecard Responses, Intent & Attribution Events); email-dedupe lead upsert
  that preserves existing data; idempotent response; Scorecard Completed /
  Booking Page Viewed intent events. No-op in demo/unconfigured. Booking adapter
  is provider-agnostic (`ADVISOR_GROWTH_REVIEW_URL`).
- **Public funnel** at `/advisor-scorecard` (own layout, outside the `(app)`
  shell): premium mobile-first landing → 18-step assessment (progress, back,
  local persistence) → contact capture (unchecked consent) → immediate
  personalized report (radial score, six meters, primary leak, strengths, 3
  findings, first fix, 30-day plan, booking + save CTAs). `?sample=1` loads the
  demo result.
- **Reusable tracking layer** (`lib/scorecard-client.ts`) — the single analytics
  client (anon/session id, UTM capture, the six scorecard events) → `/api/scorecard/event`.
- **API**: `submit` (authoritative server scoring + best-effort CRM sync),
  `event` (intent sink), `brief` (internal). Scoring never trusts the client;
  Airtable secrets are server-only (verified: no Airtable identifiers in the
  client bundle).
- **Env**: Airtable + booking vars in `@aion/shared/env` and `.env.example`
  (token is a server-only secret; ID defaults live server-side).
- **Tests**: 29 scorecard unit tests + 6 Playwright funnel e2e (desktop + mobile)
  + a client-bundle secret-leak check. Demo mode writes nothing.

## Post-scorecard conversion path

Extends the scorecard toward a booked review — deterministic, demo-safe, no
external auto-sends. See `docs/scorecard.md`.

- **Intent + nurture** (`@aion/scorecard/nurture.ts`): intent-point accumulation
  (completion/booking/discovery + growth-priority boost), tiers
  (cold/nurture/warm/hot), and a deterministic nurture plan (track, cadence, next
  actions, stop conditions). New **`scorecard_nurture`** workflow definition
  (`scorecard.completed` trigger) in `@aion/workflows`.
- **Discovery booking**: `Discovery Booked` intent via
  `/api/scorecard/booking-confirmed` (provider-agnostic) + `/advisor-scorecard/booked`
  confirmation page.
- **Advisor Brief delivery**: deterministic brief logged and written to the CRM
  Scorecard Response record; never auto-sent externally.
- **ROI business case** (`roi.ts`): illustrative, editable-assumption model of the
  upside from fixing the primary leak — explicitly not a guarantee, not financial
  advice.
- **Personalized proposal / demo** (`proposal.ts` + `/advisor-scorecard/proposal`):
  recap + ROI + recommended AION plan (Pilot recommended, Growth anchor) + next step.
- Tests: +10 scorecard unit tests (nurture/roi/proposal) and +3 e2e (proposal
  sample, results→plan handoff, booked confirmation). Totals: 39 scorecard unit
  tests, 27 Playwright e2e. Client bundle still free of Airtable identifiers.

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
