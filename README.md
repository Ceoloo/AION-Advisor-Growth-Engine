# AION Advisor Growth Engine

**AI-powered lead generation, client management, and sales automation for financial advisors and insurance professionals.**

AION is a modular intelligence and experience layer on top of **GoHighLevel**. GoHighLevel remains the CRM, communications, pipeline, calendar, and workflow backend; AION adds AI lead qualification, industry-specific sales workflows, analytics, document collection, advisor tooling, integrations, and a branded, white-label-ready client experience.

> 🧩 **This is a multi-tenant product, not one advisor's app.** Ben Peretz is **Client Zero** — his branding, messaging, checkup, CRM mapping, workflows, and compliance are **tenant configuration** ([`@aion/clients`](packages/clients)), not permanent product logic. Onboarding the next advisor is *Create Client → Select Vertical → Configure ICP → Offer → Scorecard → GHL → Compliance → Launch* (`/onboarding`), not building another app. Two design lines make this safe: a deliberate [rules-vs-AI boundary](docs/decision-boundary.md) (rules decide, AI describes) and gated [runtime modes](docs/environments.md) + [launch gate](docs/launch-gate.md).

> ⚠️ **This is an MVP skeleton.** It runs fully offline on seeded demo data (no external services required). Legal and compliance review is required before any production deployment. See [`docs/compliance-considerations.md`](docs/compliance-considerations.md).

---

## What's in the box

- **Runs offline in demo mode** — a polished, presentable dashboard on 40 seeded leads across two tenants, no API keys needed.
- **Provider-agnostic AI layer** — lead qualification, scoring signals, advisor briefings, follow-ups, next-best-action; validated with Zod; mock/OpenAI/Anthropic providers.
- **Deterministic lead scoring** — configurable, explainable, reproducible (no AI in the score itself).
- **GoHighLevel integration package** — typed client, service interfaces, webhook verification + idempotency, retry & rate-limit handling, mock services.
- **Multi-tenant by construction** — every record carries `organization_id`; Postgres Row-Level Security enforces isolation; the app layer double-checks.
- **Workflow engine** — six declarative workflow definitions (JSON) with retry and human-approval gates.
- **Full data model** — ~60 tables across tenancy, leads, CRM, financial/insurance, documents/compliance, integrations, and analytics.
- **Tested** — 47 unit tests, 9 cross-cutting integration tests, and a Playwright e2e journey. All green.

## Tech stack

| Layer | Choice |
| --- | --- |
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| UI system | `@aion/ui` (Tailwind + design tokens) |
| Database | Supabase Postgres + Row-Level Security |
| Auth | Supabase Auth (mocked in the skeleton) |
| CRM backend | GoHighLevel API (`@aion/ghl`) |
| AI | Provider-agnostic gateway (`@aion/ai`) — mock / OpenAI / Anthropic |
| Validation | Zod at every external boundary |
| Background jobs | `@aion/worker` (workflow engine; swap in Inngest/Trigger.dev/BullMQ) |
| Tests | Vitest + Playwright |

## Monorepo layout

```
apps/
  web/        Next.js dashboard + API route handlers (the demo centerpiece)
  api/        Standalone Node HTTP API service (reuses the domain packages)
  worker/     Background worker running the workflow engine
  docs/       Placeholder for a hosted docs site (docs live in /docs)
packages/
  types/        Shared domain types + enums
  shared/       Env validation, structured logging, redaction, errors, utils
  config/        Shared tsconfig / eslint presets
  ui/            React component library + design tokens
  database/      Supabase client factory, pipeline templates, demo seed + store
  auth/          RBAC + tenant-isolation helpers
  ghl/           GoHighLevel client, services, webhooks, mocks
  ai/            AI gateway, schemas, scoring, qualification, engines
  scorecard/     Advisor Conversion Scorecard — question bank, deterministic scoring, findings, brief
  scheduling/    Native calendars — availability/slot engine + round-robin assignment
  clients/       Client configuration layer — ClientConfig type, schema, registry, resolver
  workflows/     Workflow engine + JSON definitions
  analytics/     Metric aggregation + revenue funnel / baseline-vs-pilot KPIs
  observability/ Ops events + recorder + System Health roll-up
  integrations/  Pluggable adapter registry (GHL live, others mocked)
  compliance/    Audit, consent, disclosures, demo guard
infrastructure/
  migrations/    SQL schema (0001–0010) + RLS
  supabase/      Supabase CLI config
  docker/        Local Postgres stack + auth shim
  deployment/    Vercel config
scripts/         Demo seed script
tests/           Cross-cutting integration tests
docs/            Architecture, schema, integration, AI, workflows, security, …
```

## Quick start

Requires **Node ≥ 20** and **pnpm ≥ 9**.

```bash
pnpm install
cp .env.example .env        # defaults run in demo mode with the mock AI provider
pnpm dev                    # starts web (:3000), api (:3001), worker
```

Open **http://localhost:3000** — you'll land on the executive dashboard in demo mode. Start the guided tour at **/demo**.

### Useful commands

```bash
pnpm build          # build everything (web is a full Next.js production build)
pnpm test           # run all unit + integration tests
pnpm --filter @aion/web build && pnpm --filter @aion/web test:e2e   # Playwright e2e
pnpm typecheck      # TypeScript across the workspace
pnpm seed           # print a summary of the generated demo world
pnpm format         # Prettier
```

## Definition of Done — status

| Criterion | Status |
| --- | --- |
| `pnpm install` works | ✅ |
| `pnpm dev` starts the core apps | ✅ web + api + worker |
| User can sign in / enter an organization | ✅ mocked auth + onboarding |
| Demo data loads | ✅ 40 leads across 2 tenants |
| Leads appear in a pipeline | ✅ `/pipeline` Kanban |
| Lead can complete a qualification form | ✅ `/qualify` (both verticals) |
| A score is calculated | ✅ deterministic engine |
| AI summary via mocked/real provider | ✅ `/api/ai/*` + lead briefing |
| Lead can be assigned to an advisor | ✅ seeded + shown on detail |
| An appointment can be created | ✅ `/appointments` |
| Dashboard metrics update from app data | ✅ computed live |
| Mock GHL webhook creates/updates a lead | ✅ `/api/webhooks/ghl` (verified + idempotent) |
| Tenant isolation tests pass | ✅ |
| Docs for replacing mocks with live integrations | ✅ see `docs/ghl-integration.md`, `docs/ai-layer.md` |
| Modular for white-label deployments | ✅ per-org settings, tenant scoping |

## Documentation

Start with [`docs/architecture.md`](docs/architecture.md) (system diagrams), then:
[`database-schema`](docs/database-schema.md) ·
[`ghl-integration`](docs/ghl-integration.md) ·
[`ai-layer`](docs/ai-layer.md) ·
[`workflows`](docs/workflows.md) ·
[`security`](docs/security.md) ·
[`compliance-considerations`](docs/compliance-considerations.md) ·
[`client-configuration`](docs/client-configuration.md) ·
[`decision-boundary`](docs/decision-boundary.md) ·
[`kpis`](docs/kpis.md) ·
[`measurement-framework`](docs/measurement-framework.md) ·
[`launch-gate`](docs/launch-gate.md) ·
[`observability`](docs/observability.md) ·
[`advisor-brief`](docs/advisor-brief.md) ·
[`environments`](docs/environments.md) ·
[`deployment`](docs/deployment.md) ·
[`demo-guide`](docs/demo-guide.md) ·
[`api-reference`](docs/api-reference.md) ·
[`BUILD_PROGRESS`](docs/BUILD_PROGRESS.md).

## License

UNLICENSED — proprietary. All rights reserved.
