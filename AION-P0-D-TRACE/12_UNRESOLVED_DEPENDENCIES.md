# 12 — Unresolved Dependencies & Missing Evidence

Everything here is explicitly **UNRESOLVED** — recorded so the next P0 knows exactly what to fetch.
No guesses are promoted to conclusions.

## A. Out-of-scope repositories (highest-value gap)

| Repo | Why it matters | Evidence needed |
| --- | --- | --- |
| `Ceoloo/aion-company-os` | Likely holds the canonical `aion_system_registry`, event bus, memory/LEEP schema | Attach repo; re-run trace; extract canonical EVENTS/REVENUE/MEMORY contracts |
| `Ceoloo/AION-Revenue-Factory` | Likely canonical REVENUE store + Airtable⇄canonical sync | Attach; find who else reads/writes the same Airtable base `appezuvIZLMwAFnFB` |
| `Ceoloo/AION-VPS-Empire-Command.V1` | Possible schedulers/agents/workers (pg_cron, EventBridge, OpenClaw) that consume this repo's outputs | Attach; search for references to this repo's Airtable IDs / endpoints |

Confidence on their contents: **UNKNOWN** — not accessed this session.

## B. Airtable-side (out-of-repo) evidence

- **Hidden consumers:** automations, synced views, Zapier/Make/n8n webhooks, or scheduled scripts on
  base `appezuvIZLMwAFnFB` are **not visible from code**. Must be inspected in Airtable directly.
- **Actual current row counts / whether tables are live SoT vs projection:** UNKNOWN (read-only, and
  DEMO_MODE gates writes — production state not observed).
- Confidence: **UNKNOWN**.

## C. Canonical target mappings (all UNRESOLVED)

| Source | Canonical bucket | Status | Blocker |
| --- | --- | --- | --- |
| Airtable Leads / Responses / Intent Events | REVENUE / EVENTS | UNRESOLVED | canonical schema not in scope |
| Scorecard event stream | EVENTS | UNRESOLVED | canonical event bus not in scope |
| `funnel_events` / `webhook_events` / `workflow_runs` | EVENTS | UNRESOLVED | no live writer + no canonical target |
| `opportunities` / `revenue_metrics` / `messages` / `campaigns` | REVENUE | UNRESOLVED | dormant + GHL-vs-Supabase SoT undecided |

## D. Intended-but-unwired paths (dormant; direction known, implementation absent)

| Path | Declared intent | Actual state | Evidence |
| --- | --- | --- | --- |
| GHL webhook → `new_lead` workflow | enqueue workflow | logs only | `webhooks/ghl/route.ts:45` comment |
| GHL webhook → `public.webhook_events` | persist w/ UNIQUE idempotency | in-memory Map | `webhook-store.ts:1-7` comment |
| Worker heartbeat → `public.sync_jobs` | poll due jobs | debug log | `worker/src/index.ts:52` comment |
| `createDatabaseHandle` → real Supabase client | connect anon/service | stub + warn | `database/src/client.ts:1-10,30-42` |
| Workflow handlers → GHL/AI/notifications | real side effects | no-op loggers (1 real AI) | `worker/src/handlers.ts` |

These are **not** producer/consumer relationships yet — they are documented intentions. Treating
them as live edges would be inference beyond evidence, so they are logged here instead.

## E. System-of-truth decision (unresolved)

Whether the **canonical** lead/revenue SoT should be GoHighLevel, Airtable, or the Supabase schema
is **not decided in-repo**. `docs/architecture.md` says GHL owns CRM; Airtable is the live scorecard
store; Supabase schema is dormant. Reconciling these three requires product/architecture input +
the canonical repos. Status: **UNRESOLVED**.

## F. Production runtime evidence not obtainable read-only

- Live env values (DEMO_MODE in prod, whether AIRTABLE_ACCESS_TOKEN/AI keys are set): **not read**
  (secrets; and correctly so). Only variable **names** were inventoried.
- Actual Vercel cron execution history, Supabase project existence/among branches: **not queried**
  (would require live Supabase/Vercel MCP calls beyond read-only static inspection; not performed to
  honor the "do not alter/deploy" and evidence-only mandate).

## Confidence ledger

| Claim | Confidence |
| --- | --- |
| No Supabase Edge Functions exist | HIGH (directory absent) |
| No live `supabase.from/.rpc` in code | HIGH (grep=0) |
| Canonical AION event/memory/registry tables absent | HIGH (grep=0 each) |
| Airtable is the only live external write | HIGH (code-traced) |
| 3 writers to Airtable Intent Events | HIGH (code-traced) |
| Canonical target mappings | UNRESOLVED (no canonical schema in scope) |
| Airtable hidden consumers | UNKNOWN (out-of-repo) |
| Contents of 3 sibling repos | UNKNOWN (out-of-scope) |
