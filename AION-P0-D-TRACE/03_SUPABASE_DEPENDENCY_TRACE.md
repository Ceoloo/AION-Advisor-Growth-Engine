# 03 — Supabase Dependency Trace (Producer / Consumer)

## Method

Searched the entire repo for Supabase access patterns:

| Pattern | Occurrences | Where |
| --- | --- | --- |
| `supabase.from(` / `.rpc(` (live query) | **0** | — |
| `createClient` (supabase-js) | 0 | — (client factory is a stub) |
| `@supabase/supabase-js` import | 0 | Dynamic import guarded away (`packages/database/src/client.ts:1-10`) |
| `service_role` / `SUPABASE_SERVICE_ROLE_KEY` (name) | env only | `.env.example:23`, `packages/shared/src/env.ts:24` |
| `anon` / `SUPABASE_ANON_KEY` (name) | env only | `.env.example:21`, `env.ts:23` |

**Conclusion:** No application component is currently a runtime **producer or consumer** of any
Supabase table via the Supabase API. The ~61-table schema is defined in migrations but **not yet
wired to any consumer**. The only object with a live application relationship is the **Airtable**
base (documented in `06_EXTERNAL_SYSTEM_TRACE.md`), which is not Supabase.

Below, DB objects are traced by (a) the SQL that **defines** them and (b) any application symbol
that **names** them (even as a comment/intended target), classified with evidence and confidence.

---

## Supabase objects defined in schema (migrations)

Full ~61-table list in `04_SQL_FUNCTION_TRACE.md`. Objects matching the mission's target
vocabulary:

### Event-like objects present in THIS repo

| Object | Defined at | App producer | App consumer | Class |
| --- | --- | --- | --- | --- |
| `public.funnel_events` | `0008_analytics.sql:5` | none (no writer in code) | none | DORMANT |
| `public.webhook_events` | `0007_integrations.sql:21` | intended by FN-9 (currently writes in-memory Map instead) | none | DORMANT (schema) / in-memory analog live |
| `public.workflow_runs` | `0004_sales_crm.sql:131` | intended by worker/engine (writes nothing) | none | DORMANT |
| `public.opportunity_stage_history` | `0004_sales_crm.sql:46` | none | none | DORMANT |
| `public.application_status_history` | `0005_financial_insurance.sql:59` | none | none | DORMANT |

> Canonical AION event tables (`aion_events`, `aion_events_v2`, `operational_events`,
> `memory_events`, `event_memory.events`) — **DO NOT EXIST** (grep=0). Evidence: absence.

### Revenue-like objects present

| Object | Defined at | Producer | Consumer | Class |
| --- | --- | --- | --- | --- |
| `public.opportunities` | `0004_sales_crm.sql:30` | none in code | pipelines template refs stage shape only | DORMANT |
| `public.revenue_metrics` | `0008_analytics.sql:52` | none | none | DORMANT |
| `public.commissions` | `0005_financial_insurance.sql:105` | none | none | DORMANT |
| `public.campaigns` | `0004_sales_crm.sql:119` | none | RLS + metrics FK | DORMANT |
| `public.messages` | `0004_sales_crm.sql:106` | none | none | DORMANT |
| `public.referrals` | `0005_financial_insurance.sql:115` | none | none | DORMANT |
| `public.policies` / `renewals` | `0005_financial_insurance.sql:69/96` | none | none | DORMANT |

> `revenue_sync_events`, `deals`, `offers`, `proposals`, `customers` — **DO NOT EXIST** (grep=0).
> The live revenue signal lives in **Airtable** (Leads / Scorecard Responses / Intent Events),
> not in Supabase.

### Memory / knowledge objects present

| Object | Present? | Evidence |
| --- | --- | --- |
| `aion_memories`, `learning_lessons`, `aion_lessons`, `leep*`, `founder_memory`, `event_memory`, `learning_feedback` | **NONE** | grep=0 each. This repo has **no memory/knowledge/LEEP layer**. |

### Registry / architecture objects

| Object | Present? | Evidence |
| --- | --- | --- |
| `aion_system_registry`, `aion_system_registry_sources`, `aion_producer_consumer_trace`, `aion_repository_edge_trace` | **NONE** | grep=0 each. |

---

## Producer / Consumer records (evidence-backed)

Only relationships with **direct code evidence** are asserted.

### P/C-1 — Airtable Leads (external, not Supabase) — PRODUCER

```
SOURCE:  apps/web/src/lib/scorecard-sync.ts  (syncScorecardSubmission)  → client.upsertLead()
ACTION:  WRITES (UPSERT by email)
TARGET:  Airtable base appezuvIZLMwAFnFB / table tblHxq81EcZtduR5T (Leads)
EVIDENCE: scorecard-sync.ts:86-95 ; packages/integrations/src/airtable.ts:222-262 (upsertLead → create/patch)
CONFIDENCE: HIGH   CLASS: PRODUCER (gated by DEMO_MODE)
```

### P/C-2 — Airtable Scorecard Responses — PRODUCER

```
SOURCE:  scorecard-sync.ts → client.createScorecardResponse()
ACTION:  WRITES (idempotent by Response ID)
TARGET:  Airtable table tbl73qC0rKOwZwMCu (Advisor Scorecard Responses)
EVIDENCE: scorecard-sync.ts:96-123 ; airtable.ts:265-308
CONFIDENCE: HIGH   CLASS: PRODUCER
```

### P/C-3 — Airtable Intent & Attribution Events — PRODUCER (3 writers)

```
SOURCE A: scorecard-sync.ts:126-138           → "Scorecard Completed" (15 pts)
SOURCE B: api/scorecard/event/route.ts:48-58   → "Booking Page Viewed" (25 pts)
SOURCE C: api/scorecard/booking-confirmed:35-47 → "Discovery Booked" (50 pts)
ACTION:  WRITES (idempotent by Event ID)
TARGET:  Airtable table tblvhrV2lgbrZ3Ch8 (Intent & Attribution Events)
EVIDENCE: airtable.ts:311-338 (createIntentEvent)
CONFIDENCE: HIGH   CLASS: PRODUCER (MULTIPLE WRITERS — see 10_DANGEROUS_DEPENDENCIES)
```

### P/C-4 — GHL webhook → in-memory store — CONSUMER (of GHL), not Supabase

```
SOURCE:  api/webhooks/ghl/route.ts  (POST)
ACTION:  READS inbound GHL event; WRITES to in-memory Map (webhook-store.ts), NOT webhook_events table
TARGET:  in-memory Map<idempotencyKey> ; intended target public.webhook_events (0007:21)
EVIDENCE: webhooks/ghl/route.ts:37-47 ; webhook-store.ts:13-21 (comment cites 0007_integrations.sql)
CONFIDENCE: HIGH   CLASS: CONSUMER(GHL) / intended-PRODUCER(webhook_events) — not wired
```

### P/C-5 — Demo store reads (the actual runtime data source) — CONSUMER

```
SOURCE:  apps/web/src/lib/demo.ts (getLeadDetail), apps/worker/src/index.ts (getDemoStore)
ACTION:  READS in-memory seeded demo data (packages/database/src/demo/*)
TARGET:  In-memory DemoStore — NOT Supabase
EVIDENCE: api/ai/advisor-brief/route.ts:16 (getLeadDetail); worker/src/index.ts:21-23 (store.org)
CONFIDENCE: HIGH   CLASS: CONSUMER (of demo store; substitutes for Supabase in the skeleton)
```

### P/C-6 — Supabase client factory — CONFIGURES (stub)

```
SOURCE:  packages/database/src/client.ts (createDatabaseHandle)
ACTION:  CONFIGURES (returns {kind, config}; warns if no creds); does NOT connect or query
TARGET:  Supabase (anon | service) — intended, not realized
EVIDENCE: client.ts:30-42
CONFIDENCE: HIGH   CLASS: CONFIGURES-ONLY (no producer/consumer behavior)
```

## Net Supabase dependency posture

- **Supabase objects referenced by running code: 0** (via the DB API).
- **Supabase objects DEFINED but dormant: ~61 tables + 4 functions + RLS.**
- **All live producer/consumer behavior points at Airtable**, not Supabase.
- The GHL webhook and worker heartbeat name Supabase tables (`webhook_events`, `sync_jobs`) in
  comments as *intended* targets but currently use in-memory analogs.
