# 10 — Dangerous Dependencies (risk-ranked)

Risk reflects danger to a future canonical migration/cutover, given a **read-only** posture today.

## CRITICAL

### D-1 · Airtable is an undocumented-consumer store of record
- **What:** All live scorecard revenue/intent data is written to Airtable base `appezuvIZLMwAFnFB`
  (`airtable.ts`). Airtable bases commonly have **their own automations, views, and integrations**
  (Zapier/Make/n8n webhooks, scheduled syncs) that are **invisible from this repository**.
- **Why critical:** Any redirect/migration of this data can silently break downstream Airtable
  automations that P0-D cannot see from code. Hidden readers = unknowable blast radius.
- **Evidence:** `packages/integrations/src/airtable.ts:169-338`; base/table IDs `.env.example:69-72`.
- **Mitigation before cutover:** enumerate Airtable-side automations/integrations directly in the
  Airtable base (out-of-repo evidence gathering) before touching this path.

### D-2 · Three writers to one Airtable Intent Events table
- **What:** `Scorecard Completed` (scorecard-sync.ts:126), `Booking Page Viewed`
  (event/route.ts:48), `Discovery Booked` (booking-confirmed:35) all write the same table via
  `createIntentEvent`.
- **Why critical:** Multiple independent writers + idempotency-by-Event-ID means any schema/keying
  change must be coordinated across three endpoints or events are dropped/duplicated.
- **Mitigation:** treat the three as one contract; version the Event-ID scheme centrally.

## HIGH

### D-3 · Service-role bypasses RLS (future obligation)
- **What:** `0009_row_level_security.sql:6-8` states service-role connections bypass RLS and MUST
  scope by `organization_id` in the app. `SUPABASE_SERVICE_ROLE_KEY` is a production-required var
  (`env.ts:24,71`).
- **Why high:** The moment any consumer is wired to Supabase with the service key, a missing tenant
  scope is a cross-tenant data leak. Currently latent (no live Supabase code) but a guaranteed
  cutover hazard.
- **Mitigation:** enforce `scopeToTenant`/`assertSameTenant` (@aion/auth) on every service-role query.

### D-4 · GHL webhook processing is log-only; idempotency is ephemeral
- **What:** `/api/webhooks/ghl` and `apps/api /webhooks/ghl` dedupe via **in-memory** Map/Set
  (`webhook-store.ts:13`, `apps/api/src/index.ts:24`), reset on every deploy/restart. The durable
  `public.webhook_events UNIQUE(provider, idempotency_key)` (`0007:32`) is **not used**.
- **Why high:** In production, a restart re-opens the door to duplicate processing; and today no
  event is persisted at all — inbound CRM signal is lost.
- **Mitigation:** wire the route to `webhook_events` before relying on GHL-driven flows.

### D-5 · Multiple candidate systems of truth for lead/revenue data
- **What:** GoHighLevel (declared CRM SoT), Airtable (de-facto SoT for scorecard funnel), and the
  dormant Supabase schema all model leads/opportunities/intent.
- **Why high:** Cutover requires choosing one SoT and defining projection direction; ambiguity now
  becomes data divergence later.
- **Evidence:** architecture.md design principles; airtable.ts; migrations 0003/0004/0008.

## MEDIUM

### D-6 · Parallel duplicate API surfaces
- **What:** `apps/web` and `apps/api` independently implement `/webhooks/ghl`, `/ai/qualify`,
  `/health` with separate state.
- **Why medium:** Two code paths to keep in sync; a fix applied to one can be missed on the other.

### D-7 · Unauthenticated internal brief endpoint
- **What:** `POST /api/scorecard/brief` has no auth; its own comment says to gate behind
  auth/CRON_SECRET in production (`brief/route.ts:12-13`). Returns internal advisor briefs.
- **Why medium:** Information exposure if deployed as-is; not a data-integrity/migration risk.

### D-8 · Hard-coded external identifiers as defaults
- **What:** Non-secret Airtable base/table/record IDs are inlined as defaults
  (`airtable.ts:91-99`, `AIRTABLE_DEFAULTS`). Table names/IDs are hard-coded rather than resolved.
- **Why medium:** Environment drift (wrong base) writes to the wrong place silently; complicates
  repointing during migration.

## LOW

### D-9 · Dormant schema drift
- **What:** ~61 tables + RLS defined but unused by code. Over time schema and intended consumers
  drift apart.
- **Why low:** No live dependency, but raises migration cost when consumers are finally wired.

### D-10 · AI provider outbound (PII to LLM)
- **What:** `/api/ai/*` and worker send lead answers/summaries to OpenAI/Anthropic when
  `AI_PROVIDER != mock`. Default is `mock` (no call).
- **Why low (today):** Off by default; becomes a compliance item when enabled (see docs/compliance).

## Risk register summary

| ID | Risk | Level | Category |
| --- | --- | --- | --- |
| D-1 | Airtable hidden consumers | CRITICAL | external integration / hidden readers |
| D-2 | 3 writers → Intent Events | CRITICAL | multiple writers |
| D-3 | Service-role RLS bypass | HIGH | service-role access |
| D-4 | Ephemeral webhook idempotency | HIGH | webhook consumer / background |
| D-5 | Multiple systems of truth | HIGH | duplicate source |
| D-6 | Parallel API surfaces | MEDIUM | production API routes |
| D-7 | Unauth brief endpoint | MEDIUM | production API routes |
| D-8 | Hard-coded table IDs | MEDIUM | hard-coded names |
| D-9 | Dormant schema drift | LOW | undocumented workflow |
| D-10 | PII to LLM (opt-in) | LOW | external integration |
