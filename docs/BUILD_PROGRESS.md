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

## Native scheduling (GoHighLevel-style calendars)

A native calendar layer — round-robin/collective/individual calendars, a shared
team calendar, public booking links, and shared tasks. See `docs/scheduling.md`.

- **`@aion/scheduling`** (new pure package): calendar/availability/slot/task
  types; deterministic `generateSlots()` (weekly hours, slot size, buffers,
  min-notice, busy-aware, timezone offset) and `pickRoundRobin()` (least-busy).
  11 unit tests.
- **Demo data**: three calendars per org (round-robin Advisor Growth Review,
  collective Client Strategy, individual Intro) + shared tasks; store gains
  `listCalendars` / `findCalendarBySlug`.
- **Runtime overlay** (`apps/web/src/lib/scheduling-store.ts`): process-local,
  in-memory bookings + task changes over the read-only demo data — demo-safe.
- **APIs**: `/api/scheduling/slots`, `/api/scheduling/book` (round-robin,
  idempotent, slot re-verified), `/api/tasks` (+ `/status`).
- **UI**: `/calendar` (shared 7-day team view, color-coded by owner),
  `/calendars` (booking links + copy), public `/book/[slug]`, `/tasks` (board).
  New "Scheduling" nav group.
- Tests: 11 scheduling unit + 6 e2e (calendars, team calendar, public booking
  round-robin, not-found, tasks, mobile). Totals now: 11 scheduling unit tests,
  33 Playwright e2e across the app.

## Runtime modes & gated activation (DEMO → PILOT → PRODUCTION)

A deliberate, gated promotion path so no single environment variable can flip
the system live. See `docs/environments.md`.

- **`@aion/shared/mode.ts`** (new): `RuntimeMode` (`demo`/`pilot`/`production`),
  a per-mode `ModeCapabilities` matrix (mock data/AI, GHL simulation, outbound,
  CRM writes, human-approval, live campaigns, controlled volume, monitoring),
  and `resolveRuntimeMode()`. The **effective mode** is the highest tier whose
  readiness + explicit-approval gates all pass, capped by the requested
  `RUNTIME_MODE`, falling back safely otherwise. Production is **stepwise** —
  it requires a prior pilot-ready state plus its own gates. `RUNTIME_MODE`
  alone only expresses intent; `DEMO_MODE=true` hard-locks to demo. 11 unit tests.
- **Gated env signals** in `@aion/shared/env` + `.env.example`: pilot
  (`BRANDING_APPROVED`, `COMMS_APPROVED`, `PILOT_ACTIVATION_CONFIRMED`,
  `PILOT_APPROVED_BY`, plus real GHL/Airtable/booking/encryption) and production
  (`LAUNCH_APPROVED`, `PRODUCTION_ACTIVATION_CONFIRMED`,
  `PRODUCTION_ACTIVATION_TOKEN`, `PRODUCTION_APPROVED_BY`, plus Sentry/DB/cron).
- **Capabilities wired into gates**: scorecard CRM writes (`scorecard-sync`,
  `/api/scorecard/event`, `/api/scorecard/booking-confirmed`) now gate on
  `allowProductionCrmWrites`; `@aion/compliance` gains mode-aware
  `assertActionPermitted(action)` blocking outbound/destructive actions unless
  the resolved mode grants the capability. All fail closed. +3 compliance tests.
- **Governance surface**: read-only `/mode` page (effective vs requested mode,
  promotion path, per-gate pass/fail checklists, blockers, capability grid) and
  `GET /api/mode`; a mode badge + mode-aware banner in the app shell. Neither
  can promote the system — activation is a deployment action only.
- **Docs**: `docs/environments.md` activation runbook. Tests: 11 mode unit +
  3 compliance + 3 e2e (badge/banner, `/mode` checklist, read-only `/api/mode`).
  Client bundle still free of Airtable identifiers.

## Client configuration layer (product, not project)

Turns AION from a single-client build into a product: every advisor is a
declarative `ClientConfig` on the same engine — onboarding is adding a config,
not forking. See `docs/client-configuration.md`.

- **`@aion/clients`** (new pure package): the `ClientConfig` type (advisor
  identity, brand, audience/planning areas, booking + CRM/calendar providers,
  lead sources, follow-up cadence, team roster, compliance + approval status,
  demo controls), a Zod schema validated at registration (kebab-case ids,
  `organizationId === org_${slug}`, ≥1 lead-receiving member), a registry
  (`CLIENT_CONFIGS`), and a resolver (`getActiveClient()` via
  `AION_ACTIVE_CLIENT`, safe fallback to primary; `leadPool`, `defaultLeadOwner`,
  `isClientLiveApproved`). Ships **Ben Peretz** (primary, live) + **Maria Santos**
  (a second advisor in the Medicare vertical, mid-onboarding). 14 unit tests.
- **Demo seed is now config-driven**: `generateDemoWorld()` builds one tenant
  per registered config — org identity, team, lead routing, lead volume, booking
  slugs, calendars, and the scripted Marcus journey all come from the config. The
  `isBenPeretz` branch is gone.
- **Web app boots into the active client**: `DEMO_ORG_ID` and the shell org
  resolve from `getActiveClient()`. New read-only `/client` governance page
  (roster, per-advisor identity/providers/cadence, approval + compliance badges)
  and `GET /api/client`; "Client Config" nav item.
- **Docs**: `docs/client-configuration.md` + `.env.example` `AION_ACTIVE_CLIENT`.
  Tests: 14 clients unit + 3 e2e; database seed tests updated for the new second
  tenant. Client bundle still free of Airtable identifiers.

## KPI layer — the revenue funnel (Baseline vs Pilot)

Reframes the dashboard around the only question Ben cares about: did the pilot
produce more qualified opportunities and revenue? See `docs/kpis.md`.

- **Funnel engine** (`@aion/analytics/funnel.ts`): `computeFunnel()` builds the
  full nine-stage funnel — Traffic → Leads → Qualified → Appointments → Showed →
  Consultations → Opportunities → Clients → Verified Revenue — as a monotonic
  subset chain, plus the named conversion rates (lead→qualified, qualified→booked,
  booked→show, show→next-step, lead→client), first-response time, cost per lead /
  qualified lead, pipeline value, verified revenue, and source + campaign
  conversion. `compareFunnel()` produces the **BEFORE vs AFTER** comparison
  (per-stage delta + lift, rate deltas, response-time change). 11 unit tests.
- **`FunnelSnapshot`** added to `@aion/types`; demo campaigns gained top-of-funnel
  `visits` (channel-specific visit→lead ratios) so source/campaign math is real.
- **Baseline in ClientConfig**: each advisor carries a pre-AION `baseline`
  snapshot (`@aion/clients`); Ben's and Maria's are calibrated so the pilot shows
  credible lift (Ben: 24→33 leads, 9→22 qualified, 4→11 booked, 240min→5min
  response).
- **Dashboard rework**: headline conversion-rate cards, the full funnel with step
  conversions (`FunnelChart`), the **Baseline vs Pilot** table (`BaselineVsPilot`
  — the testimonial-maker), economics (pipeline value, verified revenue, CPL,
  CPQL), and source + campaign conversion tables. New read-only `/api/metrics`.
- **Docs**: `docs/kpis.md`. Tests: 11 analytics funnel unit + 3 e2e (funnel +
  baseline + `/api/metrics`); smoke updated. Client bundle still free of Airtable
  identifiers.

## Measurement framework — Observed → Modeled → Verified

A provenance guardrail on the ROI engine so a modeled projection can never be
presented as a measured or verified fact. See `docs/measurement-framework.md`.

- **`MeasurementTier`** (`observed | modeled | verified`) added to `@aion/types`.
- **ROI engine restructured** (`@aion/scorecard/roi.ts`): `computeRoiBusinessCase`
  now returns explicit `observed` (measured facts — lead volume + source, real
  booking rate / response time), `modeled` (illustrative projection — additional
  appointments, modeled opportunity, modeled annual upside, with editable
  assumptions attached), and optional `verified` (actual attributed outcomes —
  appointments, opportunities, revenue). Verified is null for a fresh prospect
  and is populated from real funnel data via the new `context` param. Disclaimer
  strengthened ("Verified results replace the model once the pilot runs").
- **Proposal UI reworked**: the ROI card is split into three visually distinct,
  color-coded tiers with a legend (`measurement-tier` component); Verified shows
  an honest pending state for prospects. The loop closes with the KPI layer —
  Verified = the dashboard's actual funnel outcomes.
- **Docs**: `docs/measurement-framework.md`. Tests: ROI unit tests rewritten for
  the tiers (+2); proposal e2e asserts all three tiers render. Client bundle
  still free of Airtable identifiers.

## Launch gate — compliance as application logic

Turns the pre-launch approval checklist into a hard, server-enforced gate: live
campaigns are refused until every critical approval is complete. See
`docs/launch-gate.md`.

- **Canonical items** in `@aion/types`: `LAUNCH_APPROVAL_ITEMS` (branding,
  biography, licensing, disclosure, messaging, data handling, CRM, calendar —
  all critical), `LaunchApprovalKey`, `LaunchApprovalState`.
- **Gate logic** in `@aion/compliance/launch-gate.ts`: `evaluateLaunchReadiness`,
  `assertLaunchEligible`, and the combined `evaluateLiveCampaignGate` /
  `assertLiveCampaignAllowed` — live campaigns require BOTH every critical
  approval AND the runtime `allowLiveCampaigns` capability (production only).
  New `launch_blocked` / `live_campaign_blocked` (403) error codes. 18 tests.
- **Per-client approvals** on `ClientConfig` (`launchApprovals`): Ben fully
  approved (Launch Eligible), Maria mid-onboarding (disclosure/messaging/data
  handling pending → blocked).
- **Enforcement**: `POST /api/campaigns/launch` calls the gate server-side and
  returns 403 with reasons when blocked — no UI override. Read-only `/api/launch`
  status; `/launch` governance page (two-gate status, server-driven checklist,
  a live "attempt to launch" button that surfaces the server refusal); the
  campaigns page shows a blocked control linking to launch readiness.
- **Docs**: `docs/launch-gate.md`. Tests: 18 launch-gate unit + 5 e2e. Client
  bundle still free of Airtable identifiers.

## Observability — AION System Health

Structured operational telemetry so failures surface before real leads flow
through. See `docs/observability.md`.

- **`@aion/observability`** (new package): `OpsEvent` model (component, type,
  status success/retry/failure/dead_letter/suppressed, retryCount, error,
  correlationId), a process-local ring-buffer `OpsRecorder`, and
  `computeSystemHealth` — a deterministic worst-wins 🟢/🟡/🔴 roll-up across the
  eight subsystems (GHL, Airtable, Scorecard, Workflows, Booking, AI, Analytics,
  Compliance). Demo seed keeps the board alive and green (incl. a recovered-on-
  retry CRM sync and a demo-suppressed outbound). 8 unit tests.
- **Wired at the real boundaries** (`recordOps`, mirrored to the structured
  logger): CRM sync (`scorecard-sync` success/failure/suppressed), webhook
  ingestion (accepted/bad-signature/invalid-payload), booking confirmation, and
  AI qualification (success / AI-failure→rule-based fallback).
- **Surfaces**: `/system-health` page (overall banner, 8-component light board
  with retry/failure/dead-letter counts, and a structured recent-event log) +
  read-only `/api/system-health`; "System Health" nav item.
- **Docs**: `docs/observability.md`. Tests: 8 observability unit + 2 e2e. Client
  bundle still free of Airtable identifiers.

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
