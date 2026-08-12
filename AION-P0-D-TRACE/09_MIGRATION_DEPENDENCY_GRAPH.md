# 09 — Migration Dependency Graph

## Live path (the only chain that touches a real external system)

```
Visitor (browser)
  ↓  advisor-scorecard funnel  (apps/web/src/app/advisor-scorecard/*)
scorecard-client.ts track()  +  POST /api/scorecard/submit
  ↓  syncScorecardSubmission()  (apps/web/src/lib/scorecard-sync.ts)
AirtableClient (packages/integrations/src/airtable.ts)
  ↓  HTTPS api.airtable.com/v0
Airtable base appezuvIZLMwAFnFB
    ├── Leads              (tblHxq81EcZtduR5T)          [WRITE upsert]
    ├── Scorecard Responses(tbl73qC0rKOwZwMCu)          [WRITE idempotent]
    └── Intent Events      (tblvhrV2lgbrZ3Ch8)          [WRITE x3 event types]
  ↓  (Airtable-side automations / consumers)
DOWNSTREAM = UNKNOWN  (not visible from this repo — potential hidden readers)
  ↓
CANONICAL TARGET = UNRESOLVED  (AION Revenue / Intent schema not in scope)
```

## Inbound path (dormant beyond logging)

```
GoHighLevel  ──webhook──▶  POST /api/webhooks/ghl
  ↓ verify HMAC (GHL_WEBHOOK_SECRET) + idempotency
in-memory Map (webhook-store.ts)   ← NOT public.webhook_events
  ↓ INTENDED (not wired): enqueue new_lead workflow → engine → ghl_upsert_contact → GHL API
  ↓ ACTUAL: log only. FULL STOP.
```

## Scheduler paths

```
Vercel cron */15 ─▶ GET /api/health ─▶ MockAdapter.healthCheck() ─▶ (no DB, no external)
worker boot ─▶ runOnce ─▶ engine.run(new_lead|appointment_booking) ─▶ no-op handlers (+1 real AI brief)
worker setInterval 60s ─▶ debug log  (INTENDED: poll public.sync_jobs — not implemented)
```

## Dormant schema graph (defined, zero code edges)

```
Supabase Postgres (migrations 0001–0010, ~61 tables, RLS)
  organizations ─┬─ memberships ─ profiles ─ auth.users
                 ├─ leads ─ lead_scores / lead_qualification_* / lead_assignments
                 ├─ pipelines ─ pipeline_stages ─ opportunities ─ opportunity_stage_history
                 ├─ conversations ─ messages ; appointments ; campaigns ; tasks ; notes
                 ├─ applications ─ policies ─ renewals ─ commissions ; referrals
                 ├─ integration_connections ; webhook_events ; sync_jobs ─ sync_errors ; external_object_mappings ; api_usage_logs
                 └─ funnel_events ; conversion_metrics ; campaign_metrics ; advisor_metrics ; revenue_metrics ; attribution_records
  Edges to application code: NONE (no supabase.from/.rpc). RLS enforced by is_org_member().
```

## Machine-readable node/edge list (canonical form)

```
# SOURCE ↓ COMPONENT ↓ FUNCTION ↓ DB OBJECT ↓ WORKFLOW ↓ EXTERNAL ↓ CANONICAL
browser → api/scorecard/submit → syncScorecardSubmission → (Airtable Leads) → scorecard-funnel → Airtable → UNRESOLVED
browser → api/scorecard/submit → createScorecardResponse → (Airtable Responses) → scorecard-funnel → Airtable → UNRESOLVED
browser → api/scorecard/submit → createIntentEvent(Scorecard Completed) → (Airtable Events) → scorecard-funnel → Airtable → UNRESOLVED
browser → api/scorecard/event → createIntentEvent(Booking Page Viewed) → (Airtable Events) → scorecard-funnel → Airtable → UNRESOLVED
external → api/scorecard/booking-confirmed → createIntentEvent(Discovery Booked) → (Airtable Events) → scorecard-funnel → Airtable → UNRESOLVED
GHL → api/webhooks/ghl → recordWebhook → (in-memory Map; intended webhook_events) → [new_lead intended] → GoHighLevel → CRM(GHL)
vercel-cron → api/health → healthCheck → (none) → health → (none) → n/a
worker → runOnce → engine.run → (none; intended workflow_runs) → new_lead/appointment_booking → AI(optional) → n/a
dashboard → api/ai/qualify → qualifyLead → (none) → n/a → OpenAI/Anthropic(optional) → AION-AI
dashboard → api/ai/advisor-brief → generateAdvisorBrief → (demo store read) → n/a → OpenAI/Anthropic(optional) → AION-AI
```

## Graph anomalies (as required by the brief)

| Anomaly | Present? | Detail / evidence |
| --- | --- | --- |
| PARALLEL PATHS | ✅ | Web (`apps/web`) and standalone API (`apps/api`) expose duplicate `/webhooks/ghl`, `/ai/qualify`, `/health` with separate in-memory idempotency stores. |
| DUPLICATE SOURCES | ✅ | Intent data exists in Airtable (live) AND is modeled by dormant `funnel_events`/`revenue_metrics`. Two idempotency stores for GHL webhooks (web Map vs api Set). |
| MULTIPLE WRITERS | ✅ | Airtable **Intent Events** table has **3 distinct writers** (submit, event, booking-confirmed). See 10. |
| MULTIPLE READERS | ⚠️ unknown | Airtable tables may have Airtable-side automation readers not visible from code. |
| CIRCULAR DEPENDENCIES | ❌ | None found. |
| LEGACY → LEGACY CHAINS | ❌ | None (no canonical/legacy AION tables present to chain). |
| CANONICAL → LEGACY WRITES | ❌ | None (no canonical objects here). |
| LEGACY → CANONICAL BRIDGES | ❌ | None (no bridge code/SQL). This absence is the core P0-D gap. |
| MULTIPLE SYSTEMS OF TRUTH | ✅ (latent) | GoHighLevel (declared CRM SoT) vs Airtable (de-facto SoT for scorecard leads/intent) vs dormant Supabase schema — three candidate stores for lead/revenue data. |
