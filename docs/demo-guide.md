# Demo Guide

The platform ships with a polished, offline demo environment — no API keys, no
database required. It's designed to be presented to a financial-services
professional as a sellable system.

## Start

```bash
pnpm install && pnpm --filter @aion/web dev
```

Open **http://localhost:3000** → you land on the **Executive Dashboard** in demo
mode (note the demo banner). Begin the guided walkthrough at **`/demo`**.

## Seeded data

Deterministic (seed = 42), regenerated in-memory on boot. The primary tenant
(**AION Demo Agency**) contains:

- **32 leads** across financial-advisor and health-insurance verticals
- **4 team members** (admin + 3 advisors/agents) with roles
- **2 pipeline templates** with all stages
- **29 opportunities**, **10 appointments**, **6 applications**, **4 active policies**
- **5 campaigns**, **63 conversation messages**, **106 timeline events**

A **second tenant** (Second Tenant Insurance) exists solely to demonstrate data
isolation — its records never appear in the first tenant's views.

## Suggested walkthrough

1. **`/demo`** — pick a persona (Financial Advisor, Health Insurance Agent, Agency Administrator) and follow the six-step lead journey.
2. **`/dashboard`** — KPI grid, conversion funnel, lead-source and advisor performance, recent activity, all computed live from the seeded data.
3. **`/leads`** — sortable lead table with score badges; click a lead.
4. **Lead detail** — recommended next action, qualification summary, **score breakdown**, activity timeline, conversation, and **AI advisor briefing** (click *Generate* — runs through the mock AI provider). Quick actions show demo-mode blocking on outbound steps.
5. **`/qualify`** — complete a qualification form for either vertical and watch the deterministic score + AI qualification compute in real time.
6. **`/pipeline`** — Kanban board across the default pipeline stages.
7. **`/appointments`**, **`/applications`**, **`/clients`** — the conversion and retention side.
8. **`/workflows`** — the six automation definitions with steps, retries, and approval gates.
9. **`/integrations`** — GoHighLevel connected; every other provider shown as a mocked adapter with health status.
10. **`/compliance`** — consent overview, audit trail, and disclosures.

## Demo safety

`DEMO_MODE=true` blocks all outbound and destructive actions (send SMS/email,
place call, delete, charge, submit application, push to GHL, bulk export). The
banner is always visible. Nothing in the demo can touch a real system.

## Talking points

- "AI qualifies and briefs; a **deterministic, auditable** engine scores."
- "GoHighLevel stays the backend — we're the **intelligence and experience layer** on top."
- "**Multi-tenant and white-label ready** — scoring weights, branding, and pipelines are per-organization."
- "**Compliance-aware by design** — consent gating, audit logging, advisor-review gates, and demo-safe operation."
