# 05 — Workflow / Orchestration Trace

## Orchestration mechanisms discovered

| Mechanism | Present | Evidence |
| --- | --- | --- |
| Vercel Cron | ✅ 1 job | `infrastructure/deployment/vercel.json:7-12` |
| Worker heartbeat scheduler | ✅ setInterval | `apps/worker/src/index.ts:53` |
| Declarative workflow engine + JSON defs | ✅ 7 workflows | `packages/workflows/src/{engine.ts,definitions/*.json}` |
| GitHub Actions | ❌ none | no `.github/` |
| pg_cron | ❌ none | grep=0 |
| AWS EventBridge / Lambda / SQS / SNS | ❌ none | grep=0 |
| n8n / Make / Zapier (live) | ❌ registry placeholders only, MockAdapter | `packages/integrations/src/registry.ts:32-34` |
| Supabase scheduled functions | ❌ none | no edge functions |
| Queue consumers | ❌ none (intended: `sync_jobs` polling, not implemented) | `worker/src/index.ts:52` comment |
| OpenClaw / agent loops | ❌ none | grep=0 |

---

## WORKFLOW-A · Vercel Health Cron

```
TRIGGER:           Vercel Cron  */15 * * * *   (vercel.json:9)
 ↓
FIRST COMPONENT:   GET /api/health  (apps/web/src/app/api/health/route.ts)
 ↓
STEP 1:            listAdapters() → healthCheck() on every MockAdapter
 ↓
DATABASE OBJECTS:  none
 ↓
EXTERNAL SYSTEMS:  none (adapters are mocks)
FINAL OUTPUT:      JSON health snapshot (demoMode, aiProvider, integrations[])
```
Purpose is liveness/observability only. No data mutation.

---

## WORKFLOW-B · Worker heartbeat (PROCESS)

```
TRIGGER:           Worker boot (apps/worker/src/index.ts main())
 ↓
STEP 1 (runOnce):  load demo org + first lead (getDemoStore)
 ↓
STEP 2:            engine.run(new_lead)  → 9 no-op handler steps
 ↓
STEP 3:            engine.run(appointment_booking) → incl. real AI generate_advisor_brief
 ↓
STEP 4 (loop):     setInterval 60s → "scheduler tick" debug log
                   (comment: "in production this polls sync_jobs / due reminders" — NOT implemented)
DATABASE OBJECTS:  intended public.sync_jobs (0007:35) — not read/written in skeleton
EXTERNAL SYSTEMS:  AI provider (only if AI_PROVIDER != mock), via generate_advisor_brief
FINAL OUTPUT:      Structured logs; advisorBrief in ctx.data
```

---

## WORKFLOW-C · Declarative workflow engine (7 definitions)

Engine: `packages/workflows/src/engine.ts` — runs steps in order, per-step retry
(`maxAttempts`/`backoffMs`), and **human-approval gates** (`requiresApproval` → short-circuit to
`awaiting_approval`, engine.ts:34-39). Handlers registered in `apps/worker/src/handlers.ts` are
**no-op loggers** except `generate_advisor_brief` (real AI call).

Definitions (`packages/workflows/src/definitions/`):

| Workflow key | Trigger (declared) | Steps (high level) | Real side effects today |
| --- | --- | --- | --- |
| `new_lead` | `lead.created` | normalize → dedupe → **ghl_upsert_contact** (retry 3) → assign source → AI qualify → score → pipeline → notify → nurture | none (all no-op) |
| `appointment_booking` | (booking) | confirm → send calendar → send intake → **generate_advisor_brief** (real AI) → schedule reminder | AI call only |
| `no_show` | no-show | (re-engagement sequence) | none |
| `post_appointment` | post-appt | (follow-up) | none |
| `referral` | referral | (referral capture) | none |
| `renewal` | renewal | (policy renewal reminders) | none |
| `scorecard_nurture` | scorecard | (nurture emails for scorecard leads) | none |

> The `new_lead` workflow is the intended **consumer** of the GHL webhook (FN-9 comment:
> "would … enqueue the New Lead workflow"). That enqueue path is **not wired** — the webhook only
> logs. So the trigger→engine linkage is declared but dormant.

### Canonical trigger→engine→DB→external chain (INTENDED vs ACTUAL)

```
INTENDED:  GHL webhook → /api/webhooks/ghl → enqueue new_lead → engine → ghl_upsert_contact
           → GoHighLevel API + persist workflow_runs/webhook_events (Supabase)
ACTUAL:    GHL webhook → /api/webhooks/ghl → verify + in-memory dedupe + LOG. Full stop.
           (no enqueue, no Supabase write, no GHL call)
```

---

## WORKFLOW-D · Scorecard funnel (the one LIVE data-producing workflow)

```
TRIGGER:   Visitor lands on /advisor-scorecard (browser)
 ↓
STEP 1:    track('advisor_scorecard_started') → POST /api/scorecard/event → log
 ↓
STEP 2:    answers questions → track(question_answered), local persistence (localStorage)
 ↓
STEP 3:    POST /api/scorecard/submit → computeScorecard() (deterministic)
 ↓
STEP 4:    syncScorecardSubmission() → [non-demo] Airtable: upsert Lead + Response + "Scorecard Completed" event
 ↓
STEP 5:    results shown; track('booking_clicked') → /api/scorecard/event → "Booking Page Viewed" (Airtable)
 ↓
STEP 6:    booking confirmed → POST /api/scorecard/booking-confirmed → "Discovery Booked" (Airtable)
DATABASE OBJECTS:  none in Supabase
EXTERNAL SYSTEM:   Airtable "Revenue & CRM OS" base (appezuvIZLMwAFnFB)
FINAL OUTPUT:      Airtable Lead + Scorecard Response + up to 3 Intent Events; personalized report to visitor
```

This is the **only orchestration in the repo that writes to a live external system.** Everything
else is demo/mock/log.

## Scheduler summary

| Scheduler | Cadence | Target | Live effect |
| --- | --- | --- | --- |
| Vercel cron | 15 min | `/api/health` | none (health only) |
| Worker setInterval | 60 s | debug log | none (sync_jobs poll not implemented) |
