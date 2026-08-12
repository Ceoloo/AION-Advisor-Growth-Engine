# 02 — Edge Function Inventory

> **There are no Supabase Edge Functions in this repository.** No `supabase/functions/`
> directory exists (`find . -type d -name functions` → empty). The Supabase CLI config
> (`infrastructure/supabase/config.toml`) enables `api`, `db`, `studio`, `auth`, `storage`
> only — **no `[functions]` / `[edge_runtime]` section**.
>
> The functional equivalent of "edge functions" in this stack is the set of **Next.js
> App-Router API route handlers** (deployed as Vercel serverless functions) plus the
> standalone `apps/api` HTTP service and the `apps/worker` background runner. Each is
> traced below with the full P0-D edge-function template.

Legend — TRIGGER TYPE: `HTTP` = request-triggered; `CRON` = scheduled; `PROCESS` = long-running.

---

## FN-1 · POST /api/scorecard/submit  ★ primary revenue write path

| Field | Value |
| --- | --- |
| FILE PATH | `apps/web/src/app/api/scorecard/submit/route.ts` |
| ENTRYPOINT | `export async function POST(request)` (line 12) |
| TRIGGER TYPE | HTTP (public; scorecard funnel form submit) |
| CALLERS | Browser: `apps/web/src/components/scorecard/*` (scorecard-experience) |
| CALLEES | `computeScorecard()` (@aion/scorecard); `syncScorecardSubmission()` → Airtable; `resolveAdvisorGrowthReviewBooking()` |
| TABLES READ | none (Supabase) |
| TABLES WRITTEN | none (Supabase). **Airtable**: Leads, Scorecard Responses, Intent Events (via sync) |
| RPC CALLED | none |
| EXTERNAL APIS | Airtable REST API (indirect, via `@aion/integrations`) |
| AUTH | none (public funnel endpoint) |
| SERVICE ROLE | none. Uses `AIRTABLE_ACCESS_TOKEN` server-side only |
| ENV VARS (names) | `DEMO_MODE`, `AIRTABLE_ACCESS_TOKEN`, `AIRTABLE_*`, `AION_*_RECORD_ID`, `ADVISOR_GROWTH_REVIEW_URL` |
| ERROR HANDLING | Zod validate → 422; Airtable sync wrapped try/catch, best-effort (never blocks report) |
| RETRY LOGIC | Process-local `syncedSubmissions` Set + Airtable idempotency by Response ID / email |
| SCHEDULING | none |
| WEBHOOKS | none out; is itself the form sink |
| DOWNSTREAM | Airtable "Revenue & CRM OS" base |
| **What causes it to execute?** | A visitor completes the Advisor Conversion Scorecard on `/advisor-scorecard`. |
| **What does it cause next?** | Deterministic score → (non-demo) Airtable upsert Lead + create Response + "Scorecard Completed" intent event → returns report + booking URL. |

---

## FN-2 · POST /api/scorecard/event  · analytics/intent sink

| Field | Value |
| --- | --- |
| FILE PATH | `apps/web/src/app/api/scorecard/event/route.ts` |
| ENTRYPOINT | `POST` (line 27) |
| TRIGGER TYPE | HTTP (fire-and-forget from browser `track()`) |
| CALLERS | `apps/web/src/lib/scorecard-client.ts` → `track()` (line 181, `fetch('/api/scorecard/event')`) |
| CALLEES | `createAirtableClient()`; `client.createIntentEvent()` |
| TABLES WRITTEN | none (Supabase). **Airtable Intent Events** — ONLY for `Booking Page Viewed`, non-demo |
| ENV VARS | `DEMO_MODE`, `AIRTABLE_*` |
| ERROR HANDLING | Zod → 422; Airtable write try/catch best-effort |
| RETRY | Airtable idempotent by Event ID |
| DOWNSTREAM | Structured log (single analytics layer) + Airtable (booking intent only) |
| **Trigger?** | Any scorecard tracking event (`advisor_scorecard_*`). |
| **Causes next?** | Always logs; if event maps to `Booking Page Viewed` and not demo → Airtable intent event. Completion intent is written authoritatively by FN-1, not here. |

---

## FN-3 · POST /api/scorecard/booking-confirmed  · discovery-booked sink

| Field | Value |
| --- | --- |
| FILE PATH | `apps/web/src/app/api/scorecard/booking-confirmed/route.ts` |
| ENTRYPOINT | `POST` (line 19) |
| TRIGGER TYPE | HTTP (scheduling tool redirect/webhook, or in-app `/advisor-scorecard/booked`) |
| CALLEES | `client.createIntentEvent()` → "Discovery Booked" (50 intent pts) |
| TABLES WRITTEN | Airtable Intent Events (non-demo, best-effort) |
| ENV VARS | `DEMO_MODE`, `AIRTABLE_*` |
| DOWNSTREAM | Airtable "Revenue & CRM OS" |
| **Trigger?** | A confirmed booking of the 15-min Advisor Growth Review. |
| **Causes next?** | Records "Discovery Booked" intent event in Airtable (or no-op in demo). |

---

## FN-4 · POST /api/scorecard/brief  · internal advisor brief

| Field | Value |
| --- | --- |
| FILE PATH | `apps/web/src/app/api/scorecard/brief/route.ts` |
| ENTRYPOINT | `POST` (line 14) |
| TRIGGER TYPE | HTTP (internal; **note: not auth-gated — comment says "gate behind auth/CRON_SECRET" in prod**) |
| CALLEES | `computeScorecard()`, `generateAdvisorBrief()`, `renderAdvisorBriefText()` (all deterministic, @aion/scorecard) |
| TABLES / EXTERNAL | none — pure computation, sends nothing externally |
| DOWNSTREAM | Returns structured brief JSON |
| **Trigger?** | Internal sales tooling requesting a brief for a submission. |
| **Causes next?** | Nothing external. Deterministic text only. |

---

## FN-5 · POST /api/ai/qualify  · lead qualification

| Field | Value |
| --- | --- |
| FILE PATH | `apps/web/src/app/api/ai/qualify/route.ts` |
| ENTRYPOINT | `POST` (line 16) |
| TRIGGER TYPE | HTTP (dashboard `/qualify`) |
| CALLEES | `extractSignals`, `computeScore`, `qualifyLead` (@aion/ai); `getGateway()` (`apps/web/src/lib/ai.ts`) |
| EXTERNAL APIS | OpenAI or Anthropic **iff** `AI_PROVIDER` set (default `mock` → no external call) |
| ENV VARS | `AI_PROVIDER`, `AI_MODEL`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` |
| ERROR HANDLING | Deterministic score always returned; AI failure degrades to rule-based fallback |
| DOWNSTREAM | AI provider (optional) |
| **Trigger?** | A lead completes a qualification form. |
| **Causes next?** | Deterministic score + AI qualification (or fallback). No DB write. |

---

## FN-6 · POST /api/ai/advisor-brief  · AI call-prep brief

| Field | Value |
| --- | --- |
| FILE PATH | `apps/web/src/app/api/ai/advisor-brief/route.ts` |
| ENTRYPOINT | `POST` (line 10) |
| CALLEES | `getLeadDetail()` (`@/lib/demo` — **reads the in-memory demo store, not Supabase**); `generateAdvisorBrief()` (@aion/ai) |
| EXTERNAL APIS | AI provider (optional, mock default) |
| TABLES READ | Demo store only (`getLeadDetail`) — no Supabase |
| **Trigger?** | Advisor opens a lead detail and requests a brief. |
| **Causes next?** | Reads demo lead, calls AI gateway, returns brief. |

---

## FN-7 · GET/POST /api/demo-control  · presentation control

| Field | Value |
| --- | --- |
| FILE PATH | `apps/web/src/app/api/demo-control/route.ts` |
| ENTRYPOINT | `GET` (line 7), `POST` (line 23) |
| CALLEES | `getPresentationState()`, `applyDemoControl()` (`@/lib/presentation-state` — in-memory) |
| EXTERNAL | none. External-sending toggle is presenter-facing only; compliance layer blocks real outbound in demo |
| **Trigger?** | Demo operator on `/demo-control`. |
| **Causes next?** | Mutates in-memory presentation state. No DB, no external. |

---

## FN-8 · GET /api/health  · health snapshot ★ the only cron target

| Field | Value |
| --- | --- |
| FILE PATH | `apps/web/src/app/api/health/route.ts` |
| ENTRYPOINT | `GET` (line 6) |
| TRIGGER TYPE | HTTP **and CRON** — Vercel cron `*/15 * * * *` (`vercel.json:7-12`) |
| CALLEES | `listAdapters()[].healthCheck()` (all MockAdapter) |
| EXTERNAL | none real (mock adapters) |
| **Trigger?** | Vercel scheduler every 15 min, or manual GET. |
| **Causes next?** | Returns integration health snapshot. No side effects. |

---

## FN-9 · POST /api/webhooks/ghl  · GoHighLevel inbound webhook

| Field | Value |
| --- | --- |
| FILE PATH | `apps/web/src/app/api/webhooks/ghl/route.ts` |
| ENTRYPOINT | `POST` (line 13) |
| TRIGGER TYPE | HTTP webhook (GoHighLevel → AION) |
| CALLEES | `verifyWebhookSignature`, `parseWebhook`, `webhookIdempotencyKey` (@aion/ghl); `recordWebhook()` (`@/lib/webhook-store` — **in-memory Map, not the `webhook_events` table**) |
| AUTH | HMAC signature via `GHL_WEBHOOK_SECRET` (when set); unset → accepted but flagged unverified |
| SERVICE ROLE | none |
| ENV VARS | `GHL_WEBHOOK_SECRET` |
| ERROR HANDLING | bad sig → 401; bad payload → 400; duplicate → 200 ack |
| RETRY / IDEMPOTENCY | idempotency key deduped via in-memory Map (`webhook-store.ts`) |
| DOWNSTREAM | **Log only.** Comment (line 45): real processing "would … enqueue New Lead workflow" — not implemented |
| **Trigger?** | GHL emits a contact/opportunity webhook. |
| **Causes next?** | Verify → dedupe → log. Does NOT currently persist to `webhook_events` or enqueue the workflow. |

---

## apps/api (standalone Node HTTP service) — mirror surface

`apps/api/src/index.ts` re-exposes a subset with the same domain packages:
- `GET /health` (line 34) — health + mock adapters
- `POST /leads/score` (line 45) — deterministic score only
- `POST /ai/qualify` (line 55) — AI gateway
- `POST /webhooks/ghl` (line 64) — verify + in-memory idempotency Set + return (no DB, no enqueue)

Server plumbing: `apps/api/src/server.ts` (correlation id, structured logging).

## apps/worker (background PROCESS)

`apps/worker/src/index.ts`:
- `runOnce()` (line 18): loads demo org+lead, runs `new_lead` and `appointment_booking`
  workflow definitions through the engine.
- Heartbeat `setInterval(60_000)` (line 53): "in production this polls `sync_jobs` / due
  reminders" — **not implemented**; logs a debug tick.
- `WORKER_ONCE=true` → single pass (CI).

`apps/worker/src/handlers.ts`: registers step handlers. All are `noop(label)` loggers
**except** `generate_advisor_brief` (line 48) which makes a real `@aion/ai` gateway call.
No handler writes to Supabase or GHL for real in the skeleton.

## Summary counts

| Metric | Count |
| --- | --- |
| Supabase Edge Functions | **0** |
| Next.js API route handlers (web) | 9 |
| Standalone API routes (apps/api) | 4 |
| Worker processes | 1 (+ 2 workflows executed, 1 heartbeat) |
| Route handlers touching a **live external write** | 3 (scorecard submit/event/booking-confirmed → Airtable) |
| Route handlers touching **Supabase** | **0** |
