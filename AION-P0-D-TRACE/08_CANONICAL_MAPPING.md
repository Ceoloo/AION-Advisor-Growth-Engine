# 08 — Canonical Target Mapping

**Rule honored:** do NOT invent canonical systems; where the mapping is not verifiable, mark
`UNRESOLVED`. This repo contains **no canonical AION schema** (`aion_system_registry`,
`aion_events`, memory tables — all absent), so there is no in-repo destination to map onto. Every
mapping below is therefore either **UNRESOLVED** (canonical schema lives in a repo not in scope) or
a same-repo intended-consolidation note.

## Canonical buckets (from the mission): EVENTS · REVENUE · KNOWLEDGE/MEMORY

| Local / live source | Evidence | Canonical bucket | Canonical target | Confidence |
| --- | --- | --- | --- | --- |
| Airtable Intent & Attribution Events | airtable.ts:311-338 | EVENTS / REVENUE(intent) | **UNRESOLVED** (canonical event/intent schema not in this repo) | — |
| Airtable Leads | airtable.ts:222-262 | REVENUE | **UNRESOLVED** (canonical revenue/lead schema not in scope) | — |
| Airtable Scorecard Responses | airtable.ts:265-308 | REVENUE | **UNRESOLVED** | — |
| Scorecard `/api/scorecard/event` stream | event/route.ts | EVENTS | **UNRESOLVED** | — |
| `public.funnel_events` (dormant) | 0008:5 | EVENTS | **UNRESOLVED** (candidate: AION Events) | LOW |
| `public.webhook_events` (dormant) | 0007:21 | EVENTS | **UNRESOLVED** (candidate: AION Events) | LOW |
| `public.workflow_runs` (dormant) | 0004:131 | EVENTS/ops | **UNRESOLVED** | LOW |
| `public.opportunities` (dormant) | 0004:30 | REVENUE | **UNRESOLVED** (also: GoHighLevel is declared CRM SoT) | LOW |
| `public.revenue_metrics` (dormant) | 0008:52 | REVENUE | **UNRESOLVED** (projection/rollup) | LOW |
| `public.messages` / `campaigns` (dormant) | 0004:106/119 | REVENUE/comms | **UNRESOLVED** (GHL owns comms per architecture.md) | LOW |
| Memory/LEEP/lessons | ABSENT | KNOWLEDGE/MEMORY | **N/A — nothing to map** | — |

## Within-repo consolidation direction (verifiable, not canonical-cross-repo)

Two authoritative statements in the repo *do* let us record intended direction without guessing:

1. **GoHighLevel is the CRM system-of-record** (`docs/architecture.md`, "Design principles":
   *"GoHighLevel is the system of record for CRM data"*). → CRM-shaped local tables
   (`contacts`, `opportunities`, `messages`, `campaigns`, `appointments`, `conversations`) are
   intended **projections of GHL**, not independent SoT. Canonical CRM target = **GoHighLevel**
   (confidence HIGH for the *direction*; the Supabase mirror is dormant).

2. **Airtable "Revenue & CRM OS" base is the current revenue/intent store** for the scorecard funnel
   (airtable.ts header + `.env.example:63`). Its canonical AION destination is **UNRESOLVED** because
   the canonical revenue schema is defined in a repo not in this session's scope.

## Explicit UNRESOLVED declarations

- Canonical **EVENTS** target for Airtable Intent Events + scorecard event stream: **UNRESOLVED**
  (need the canonical `aion_events`/event-bus schema, absent here).
- Canonical **REVENUE** target for Airtable Leads/Responses and dormant `opportunities`/`revenue_metrics`:
  **UNRESOLVED** (need canonical revenue schema; also reconcile against GoHighLevel as CRM SoT).
- Canonical **KNOWLEDGE/MEMORY** target: **N/A** — no memory source exists in this repo.

No mapping is asserted with HIGH confidence to a canonical object, because **no canonical object is
present in this repository to verify against.** Resolving these requires the canonical-schema repo
(`aion-company-os` / `AION-Revenue-Factory`) to be in scope.
