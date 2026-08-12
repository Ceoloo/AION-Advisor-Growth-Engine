# 06 — External System Trace

Direction is from AION's perspective: **OUT** = AION writes/calls; **IN** = external calls AION.

## Tier 1 — Live-capable (real network I/O in code)

### Airtable — "Revenue & CRM OS" base  ★ the only live external WRITE

```
EXTERNAL SYSTEM:  Airtable  (base appezuvIZLMwAFnFB)
REPOSITORY:       AION-Advisor-Growth-Engine
FILE:             packages/integrations/src/airtable.ts
FUNCTION:         AirtableClient.upsertLead / createScorecardResponse / createIntentEvent
DIRECTION:        OUT (WRITE) — HTTPS to https://api.airtable.com/v0 (line 178-196)
DATA:             Leads (tblHxq81EcZtduR5T), Scorecard Responses (tbl73qC0rKOwZwMCu),
                  Intent & Attribution Events (tblvhrV2lgbrZ3Ch8)
SUPABASE OBJECT:  none (Airtable is the store of record for this data)
CANONICAL SYSTEM: AION Revenue / Intent (canonical target UNRESOLVED — see 08)
AUTH:             AIRTABLE_ACCESS_TOKEN (secret, server-side only; env.ts:49)
GATE:             DEMO_MODE=true → no writes (scorecard-sync.ts:60-63; event route:44; booking:29)
CONFIDENCE:       HIGH
```
Callers: `apps/web/src/lib/scorecard-sync.ts`, `api/scorecard/event`, `api/scorecard/booking-confirmed`.
Field mapping centralized in `AIRTABLE_FIELDS` (airtable.ts:14-71). Non-secret base/table IDs also
in `.env.example:69-74`.

### GoHighLevel (GHL / LeadConnector) — CRM backend

```
EXTERNAL SYSTEM:  GoHighLevel  (https://services.leadconnectorhq.com)
FILE:             packages/ghl/{client.ts,webhooks.ts,mock.ts}; apps/web/src/app/api/webhooks/ghl/route.ts
DIRECTION:        IN  (webhook: GHL → /api/webhooks/ghl) — verify HMAC + idempotency + LOG only
                  OUT (client.ts exists for REST v2) — NOT called for real in skeleton (mock services)
DATA:             contact/opportunity webhook envelopes (inbound); intended contact upsert (outbound)
SUPABASE OBJECT:  intended public.webhook_events / external_object_mappings (not wired)
CANONICAL SYSTEM: GoHighLevel is declared system-of-record for CRM (docs/architecture.md)
AUTH:             GHL_WEBHOOK_SECRET (inbound HMAC); GHL_CLIENT_ID/SECRET/REDIRECT_URI (OAuth, unused)
CONFIDENCE:       HIGH (inbound verify+log); OUTBOUND is mock/dormant
```

### OpenAI / Anthropic — AI providers

```
EXTERNAL SYSTEM:  OpenAI, Anthropic
FILE:             packages/ai/providers/{openai.ts,anthropic.ts,mock.ts}; gateway.ts
FUNCTION:         AIGateway → provider.generate(); qualifyLead / generateAdvisorBrief
DIRECTION:        OUT (LLM completion) — ONLY when AI_PROVIDER ∈ {openai,anthropic}; default mock (no call)
DATA:             lead answers, summaries (qualification, advisor brief)
SUPABASE OBJECT:  none
CANONICAL SYSTEM: AION AI layer (provider-agnostic)
AUTH:             OPENAI_API_KEY / ANTHROPIC_API_KEY; AI_MODEL default claude-sonnet-4-5 (env.ts:35)
CONSUMERS:        /api/ai/qualify, /api/ai/advisor-brief, worker generate_advisor_brief, apps/api /ai/qualify
CONFIDENCE:       HIGH
```

### Booking provider (provider-agnostic)

```
EXTERNAL SYSTEM:  Scheduling tool (e.g. Cal.com/Calendly — URL only)
FILE:             packages/integrations/src/booking.ts
DIRECTION:        OUT (redirect visitor to ADVISOR_GROWTH_REVIEW_URL); return path → /api/scorecard/booking-confirmed
DATA:             booking intent (no PII sent by AION; visitor books directly)
CANONICAL SYSTEM: AION Intent (Discovery Booked event)
AUTH:             none (public URL); unset → graceful "coming soon" + intent still recorded
CONFIDENCE:       HIGH
```

### Vercel — hosting + cron

```
EXTERNAL SYSTEM:  Vercel
FILE:             infrastructure/deployment/vercel.json
DIRECTION:        Platform (build/deploy web) + IN (cron → /api/health every 15 min)
CONFIDENCE:       HIGH
```

## Tier 2 — Referenced / mocked (declared, no live client code)

`packages/integrations/src/registry.ts` registers these as **MockAdapter** placeholders (health
checks return a consistent shape; no real I/O):

`twilio, telnyx, sendgrid, mailgun` (comms) · `stripe, square` (payments) ·
`docusign, pandadoc` (e-sign) · `google_calendar, outlook_calendar` (calendar) ·
`google_drive, dropbox` (storage) · `clearbit, apollo, enrichment` (enrichment) ·
`zapier, make, n8n` (automation) · `carrier_api, quote_platform` (insurance).

Only `gohighlevel` is `implemented: true` (registry.ts:17).

## Tier 3 — Config-name-only (no client code at all)

| System | Where | Status |
| --- | --- | --- |
| Sentry | `SENTRY_DSN` (env.ts:37, .env.example:52) | env name only; no SDK |
| PostHog | `POSTHOG_KEY`/`POSTHOG_HOST` (.env.example:53-54) | env name only; no SDK |
| Stripe secret | `STRIPE_SECRET_KEY` (.env.example:49) | env name only (registry mock) |

## NOT PRESENT (searched, grep = 0)

Slack, Discord, Notion, HubSpot (only appears in a docs/comment context, no client), AWS
(EventBridge/Lambda/SQS/SNS), OpenClaw, Hermes, and any agent runtime. GitHub appears only as the
git host, not as an integration target in code.

## External-system summary

| System | Direction | Live in code? | Gated by DEMO_MODE? | Canonical target |
| --- | --- | --- | --- | --- |
| Airtable | OUT write | ✅ yes | ✅ yes | UNRESOLVED (Revenue/Intent) |
| GoHighLevel | IN webhook / OUT (dormant) | inbound yes / outbound no | webhook processing is log-only | CRM system-of-record |
| OpenAI/Anthropic | OUT | ✅ (non-mock) | provider default mock | AION AI layer |
| Booking URL | OUT redirect | ✅ (URL) | intent still recorded | AION Intent |
| Vercel | platform + cron IN | ✅ | n/a | infra |
| 19 registry providers | — | ❌ mock | n/a | roadmap |
| Sentry/PostHog | OUT (obs) | ❌ name only | n/a | observability |
