# 11 — P0-D Executive Findings

## Migration classification per source (REDIRECT_NOW / MIGRATE / DUAL_READ / READ_ONLY / RETIRE / UNRESOLVED)

Rule honored: when uncertain → **UNRESOLVED**. No production migration recommended.

| Source | Live? | Classification | Rationale |
| --- | --- | --- | --- |
| Airtable Leads | yes | **DUAL_READ** (candidate) | Live SoT for scorecard leads; canonical target unresolved; hidden Airtable consumers must be mapped before redirect. |
| Airtable Scorecard Responses | yes | **DUAL_READ** (candidate) | Same as above; idempotent keys exist. |
| Airtable Intent Events | yes | **DUAL_READ** (candidate) | 3 writers; live intent signal; canonical event schema not in scope. |
| Scorecard `/api/scorecard/event` stream | yes | **UNRESOLVED** | Sink is logs+Airtable; canonical events schema absent. |
| `public.funnel_events` | dormant | **UNRESOLVED** | No writer to redirect; define consumer first. |
| `public.webhook_events` | dormant | **UNRESOLVED** | Route uses in-memory analog; not yet a real source. |
| `public.workflow_runs` | dormant | **UNRESOLVED** | Engine writes nothing yet. |
| `public.opportunities`, `revenue_metrics`, `messages`, `campaigns`, `commissions`, `policies`, `renewals`, `referrals` | dormant | **UNRESOLVED** / lean **READ_ONLY** | Empty/unwired; GHL is declared CRM SoT — direction needs confirmation. |
| Canonical `aion_events`/`operational_events`/`event_memory` | absent | **N/A** | Not present in this repo. |
| Memory/LEEP/lessons/`founder_memory` | absent | **N/A** | Not present in this repo. |
| `aion_system_registry*` / trace tables | absent | **N/A** | Not present; this repo is unregistered. |

No source qualifies for **REDIRECT_NOW** (no verified canonical replacement in scope) or **RETIRE**
(the dormant tables have no dependents but also no confirmation they're obsolete).

---

## The 17 executive answers

1. **Repositories scanned:** 1 (`AION-Advisor-Growth-Engine`). 3 other AION repos were out of session scope.
2. **Edge Functions:** 0 Supabase Edge Functions. Functional equivalents: 9 Next.js API routes + 4 apps/api routes + 1 worker.
3. **SQL functions:** 4 (`set_updated_at`, `current_profile_id`, `is_org_member`, `has_org_role`) + 13 updated_at triggers. 0 views, 0 RPC calls from app.
4. **Workflows:** 7 declarative workflow definitions; 2 orchestration schedulers (Vercel cron, worker heartbeat); 1 live funnel workflow. GitHub Actions/pg_cron/EventBridge = 0.
5. **Supabase objects referenced:** ~61 tables **defined**; **0** referenced by running code via the Supabase API.
6. **Legacy sources actively WRITTEN:** 3 — Airtable Leads, Scorecard Responses, Intent Events. (0 Supabase tables written by code.)
7. **Legacy sources actively READ:** in-memory demo store + Airtable dedupe reads (`findOne`). 0 Supabase tables read by code.
8. **Sources with multiple writers:** Airtable **Intent Events** (3 writers). GHL webhook idempotency has 2 parallel stores (web/api).
9. **Sources with multiple systems of truth:** lead/revenue data — GoHighLevel (declared) vs Airtable (de-facto) vs dormant Supabase schema.
10. **Sources that can be redirected NOW:** **none** (no verified canonical target in scope).
11. **Require migration (transform):** Airtable Leads/Responses/Events → canonical revenue/intent (once canonical schema is in scope).
12. **Require dual-read:** the three Airtable tables (coexist with canonical during cutover).
13. **Should become read-only:** dormant Supabase revenue/CRM tables *if* GHL/Airtable are confirmed SoT (currently empty, so effectively already read-only).
14. **Can eventually be retired:** candidates = duplicate dormant projections (`revenue_metrics`, `funnel_events`) IF Airtable/canonical supersede them — **not confirmed**, so UNRESOLVED.
15. **Remains unresolved:** all canonical target mappings (no canonical schema in scope); Airtable-side hidden consumers; whether dormant Supabase tables are the intended future SoT; the 3 out-of-scope repos.
16. **Top 10 cutover blockers:** see below.
17. **Exact evidence still missing:** see `12_UNRESOLVED_DEPENDENCIES.md`.

## Top 10 cutover blockers

1. **Canonical schema is not in this session's scope** — cannot map Airtable/Supabase → canonical with HIGH confidence (blocks all REDIRECT/RETIRE).
2. **Airtable hidden consumers** (base automations/integrations) unknown from code (D-1).
3. **Airtable Intent Events has 3 writers** needing a coordinated contract (D-2).
4. **Service-role RLS bypass** obligation once Supabase is wired (D-3).
5. **GHL webhook is log-only with ephemeral idempotency** — inbound CRM signal not persisted (D-4).
6. **Three candidate systems of truth** for leads/revenue, undecided (D-5).
7. **Dormant Supabase schema** has zero live consumers — intended wiring undefined (P/C trace).
8. **Parallel duplicate API surfaces** (web vs api) with independent state (D-6).
9. **Hard-coded Airtable base/table IDs** as defaults risk wrong-target writes (D-8).
10. **3 sibling AION repos untraced** — cross-repo producer/consumer edges to this repo are unknown.

---

# RECOMMENDED NEXT P0

**Do NOT delete anything. Do NOT run a production migration.** Before any REDIRECT / MIGRATE /
DUAL-READ / READ-ONLY / RETIRE decision, gather this exact evidence:

### Before REDIRECT
- Bring the canonical-schema repo(s) (`aion-company-os` / `AION-Revenue-Factory`) into scope and
  confirm the concrete canonical EVENTS + REVENUE table/API contracts.
- Enumerate Airtable-side automations/integrations on base `appezuvIZLMwAFnFB` to eliminate hidden
  readers (out-of-repo, in Airtable directly).

### Before MIGRATE
- Define the field-level transform from `AIRTABLE_FIELDS` (Leads/Responses/Events) → canonical
  schema. Dedupe keys already exist (email, Response ID, Event ID) — verify they align with canonical keys.

### Before DUAL-READ
- Stand up the canonical writer alongside the Airtable writer in `scorecard-sync.ts` / the two event
  routes; confirm both accept the same idempotency contract.

### Before READ-ONLY
- Confirm no future consumer is scheduled to write the dormant Supabase revenue/CRM tables (they are
  empty today); decide GHL-vs-Supabase projection direction.

### Before RETIRE
- Prove zero dependents for each dormant/duplicate table across **all** AION repos (requires the
  cross-repo sweep) — not provable from this repo alone.

### Recommended immediate, non-destructive P0-E
**"Canonical Schema + Airtable-Consumer Reconciliation"** — attach the 3 sibling repos and the
Airtable base, then re-run this exact trace across them so the canonical targets currently marked
UNRESOLVED can be resolved with HIGH-confidence evidence.
