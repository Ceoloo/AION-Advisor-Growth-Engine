# 07 — Legacy Source Trace

Each mission-designated legacy source is answered against **direct evidence from this repo**.
The dominant result: **most canonical AION legacy sources are ABSENT here** (grep=0). Present
analogs are Supabase schema tables that are **dormant** (no code reads/writes them) plus the
**Airtable** revenue/intent store, which is live.

Answer key per source (questions 1–14 from the brief):
1 writers · 2 readers · 3 dependent functions · 4 dependent workflows · 5 dependent external ·
6 canonical replacement · 7 active? · 8 historical? · 9 source of truth? · 10 projection/cache? ·
11 duplicate? · 12 safe to redirect? · 13 safe to make read-only? · 14 migration transform.

---

## EVENTS

### `events`, `aion_events`, `aion_events_v2`, `operational_events`, `memory_events`, `event_memory.events`
- **Presence:** NONE in repo (grep=0 each). Evidence: whole-repo search, 2026-08-12.
- 1–5: no writers/readers/functions/workflows/external in this repo.
- 6 canonical replacement: N/A (they *are* canonical elsewhere; absent here).
- 7 active? **No (not in this repo).** 8 historical? No. 9 SoT? No. 10 projection? No.
  11 duplicate? No. 12 redirect? N/A. 13 read-only? N/A.
- 14 transform: **None from this repo.** If AION wants this repo to emit canonical events, that is
  net-new integration work, not a migration of existing data.

### `public.funnel_events` (local analytics event table)  — the closest local analog
- 1 writers: **none in code** (schema only, `0008_analytics.sql:5`). 2 readers: none.
- 3 functions: none. 4 workflows: none. 5 external: none.
- 6 canonical replacement: AION Events (candidate) — **UNRESOLVED** (no canonical schema to map to here).
- 7 active? **No** (dormant). 8 historical? No. 9 SoT? No. 10 projection? Intended analytics projection.
  11 duplicate? Potentially overlaps the Airtable Intent Events stream conceptually.
- 12 redirect? Not yet (no writer to redirect). 13 read-only? Already effectively read-only (empty).
- 14 transform: define a writer first; then map `stage/metadata` → canonical event envelope.

### `public.webhook_events` (integration event table)
- 1 writers: **intended** by `/api/webhooks/ghl`; **actual writer = in-memory Map** (`webhook-store.ts`).
- 2 readers: none. 3 functions: RLS `webhook_tenant` (0009:64). 4 workflows: intended `new_lead` (not wired).
- 5 external: GoHighLevel (source of the events). 6 canonical: AION Events (UNRESOLVED).
- 7 active? **No** (table dormant; live path is in-memory & ephemeral). 9 SoT? No. 10 cache? the in-memory Map is a cache.
- 12 redirect? Wire the route to the table first. 14 transform: persist `{provider,event_type,idempotency_key,payload}`.

### Scorecard `/api/scorecard/event` "single event architecture"
- 1 writers: browser `track()` → route. 2 readers: logs; Airtable (booking-intent subset).
- This is a **live event stream** but its sink is **structured logs + Airtable**, not a Supabase event table.
- 6 canonical: AION Intent/Events (UNRESOLVED). 12 redirect? Could dual-write to canonical once defined.

---

## REVENUE

### `revenue_*`, `opportunities`, `deals`, `offers`, `proposals`, `customers`, `meetings`, `messages`
| Name | In repo? | Evidence | Live? |
| --- | --- | --- | --- |
| `opportunities` | ✅ schema only | `0004_sales_crm.sql:30` | dormant (no code writer/reader) |
| `revenue_metrics` | ✅ schema only | `0008_analytics.sql:52` | dormant |
| `commissions` | ✅ schema only | `0005:105` | dormant |
| `messages` | ✅ schema only | `0004:106` | dormant |
| `campaigns` | ✅ schema only | `0004:119` | dormant |
| `referrals`/`policies`/`renewals` | ✅ schema only | `0005` | dormant |
| `deals`, `offers`, `proposals`, `customers`, `meetings` | ❌ absent | grep=0 | n/a |
| `revenue_sync_events` | ❌ absent | grep=0 | n/a |

For each present-but-dormant revenue table: 1 writers none · 2 readers none · 3 functions none
(only `set_updated_at` trigger on opportunities) · 4 workflows none · 5 external none ·
6 canonical AION Revenue (UNRESOLVED) · 7 active **No** · 9 SoT **No** · 10 projection (metrics tables are
projections/rollups by design) · 11 duplicate (revenue_metrics duplicates data that today lives in
Airtable Responses/Events) · 12 redirect no (no writer) · 13 read-only already-empty · 14 transform:
define writers (from Airtable and/or GHL) before any mapping.

### Airtable revenue projections (LIVE)
- **This is the actual live revenue/intent store.** 1 writers: `scorecard-sync.ts`, `event`,
  `booking-confirmed`. 2 readers: humans in Airtable UI (and any Airtable automations — **not
  visible from this repo**). 3 functions: `AirtableClient.*`. 4 workflows: scorecard funnel (WORKFLOW-D).
  5 external: Airtable base automations = **UNKNOWN from code** (potential hidden readers).
- 6 canonical: AION Revenue/Intent (UNRESOLVED). 7 active? **Yes** (non-demo). 9 SoT? **Yes for
  scorecard-sourced leads/intent** currently. 10 projection? Partly (mirrors CRM). 11 duplicate?
  Overlaps intended Supabase `leads`/`funnel_events`/`revenue_metrics`.
- 12 safe to redirect? **Not yet** — hidden Airtable-side automations/consumers must be enumerated first.
- 13 safe to read-only? **Not yet** — it is an active write target and likely SoT.
- 14 transform: Airtable field schema (`AIRTABLE_FIELDS`) → canonical revenue/intent schema; dedupe
  keys already exist (email, Response ID, Event ID).

---

## MEMORY / KNOWLEDGE

### `aion_memories`, `learning_lessons`, `aion_lessons`, `LEEP`/`leep_events`/`leep_extracted_lessons`, `event_memory`, `founder_memory`, `learning_feedback`
- **Presence:** NONE (grep=0 each). This repository has **no memory, knowledge, lessons, or LEEP layer.**
- 1–5: none. 6: N/A. 7 active? No. 8 historical? No. 9 SoT? No. 12/13: N/A.
- 14 transform: none — there is nothing here to migrate. Any memory integration is net-new.

---

## REGISTRY / ARCHITECTURE

### `aion_system_registry(_sources)`, `aion_producer_consumer_trace`, `aion_repository_edge_trace`
- **Presence:** NONE (grep=0). This repo is **not self-registered** into the canonical registry and
  emits no producer/consumer/edge trace rows. That gap is precisely what P0-D exists to close.

---

## Legacy-source scoreboard

| Category | Canonical names present? | Local analogs present (dormant)? | Live store? |
| --- | --- | --- | --- |
| Events | ❌ none | `funnel_events`, `webhook_events`, `workflow_runs` (dormant) | Airtable Intent Events + logs |
| Revenue | ❌ (`deals/offers/proposals/customers` absent) | `opportunities`, `revenue_metrics`, `commissions`, `messages`, `campaigns` (dormant) | Airtable Leads/Responses |
| Memory | ❌ none | none | none |
| Registry | ❌ none | none | none |

**Actively WRITTEN legacy-equivalent sources:** Airtable Leads, Airtable Scorecard Responses,
Airtable Intent Events (3). **Actively READ from code:** in-memory demo store + Airtable dedupe
reads (findOne). **Zero Supabase legacy tables are actively read or written by running code.**
