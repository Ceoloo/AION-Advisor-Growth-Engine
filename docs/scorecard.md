# Advisor Conversion Scorecard

AION's Client Zero acquisition funnel: a premium, mobile-first diagnostic that
scores an advisor's **sales & marketing conversion infrastructure** (not their
financial planning) and routes a qualified lead toward a 15-minute Advisor
Growth Review.

> This is a marketing/sales process diagnostic. It does **not** provide
> financial, investment, legal, tax, or insurance-product advice.

## Funnel

```
Traffic / outbound → /advisor-scorecard → 18-question assessment → contact capture
→ deterministic 0–100 score → leak diagnosis → personalized report
→ CRM lead + Scorecard Completed intent (server-side) → Book Advisor Growth Review
```

## Architecture (extends the existing app — no new framework/db/auth)

| Concern | Where | Notes |
| --- | --- | --- |
| Scoring model | `@aion/scorecard` (new package) | Pure, deterministic config + engine; like `@aion/ai`. All tests here. |
| CRM writes | `@aion/integrations` (`airtable.ts`) | Server-side Airtable client, real field mappings, idempotent, no-op in demo. |
| Booking | `@aion/integrations` (`booking.ts`) | Provider-agnostic URL via `ADVISOR_GROWTH_REVIEW_URL`. |
| Env | `@aion/shared/env` + `.env.example` | Airtable token is a server-only secret. |
| Public UI | `apps/web/src/app/advisor-scorecard/*` | Own layout, outside the authenticated `(app)` shell. |
| Funnel components | `apps/web/src/components/scorecard/*` | Client; reuse `@aion/ui` + Tailwind. |
| Tracking | `apps/web/src/lib/scorecard-client.ts` | The single event layer (anon/session id, UTM capture, local persistence). |
| API | `apps/web/src/app/api/scorecard/{submit,event,brief}` | Zod-validated; scoring authoritative server-side. |
| Server sync | `apps/web/src/lib/scorecard-sync.ts` | Orchestrates Airtable + Advisor Brief; best-effort, demo-gated. |

## Scoring model

Total **100**, six sections: **Acquisition 15 · Speed-to-Lead 15 · Qualification
20 · Follow-Up & Nurture 20 · Booking & Show 15 · CRM & Attribution 15**. Each
question's points and copy live in `packages/scorecard/src/questions.ts`; section
weights, first-fix, and 30-day plans in `sections.ts` — both easy to edit.

**Bands:** 0–29 Critical · 30–49 High Leakage · 50–69 Conversion Gaps · 70–84
Strong Foundation · 85–100 Optimized.

**Primary leak** is the weakest section by **normalized percentage** (sections
have different maxes). If two or more sections are within 3 percentage points of
the minimum, it collapses to **"Multiple / Systemic"** while still exposing a
concrete section to drive the first fix. **Findings** are the three questions
with the largest normalized gaps.

## Routes

- `GET /advisor-scorecard` — public funnel (landing → 18 questions → contact → results). `?sample=1` loads the deterministic Marcus Johnson demo (57 / Conversion Gaps).
- `POST /api/scorecard/submit` — validate → score (authoritative) → best-effort CRM sync → return report + booking target.
- `POST /api/scorecard/event` — the analytics/intent sink (logs every event; persists booking intent to Airtable).
- `POST /api/scorecard/brief` — internal deterministic Advisor Brief (not auto-sent).

## Data flow

1. Client validates required fields, POSTs the raw answers + contact + attribution + a stable `submissionId`.
2. Server recomputes the score (never trusts the client), builds the report.
3. In demo mode or without Airtable creds → **no writes**; the report still returns.
4. Otherwise (best-effort, non-blocking):
   - **Upsert Lead** by email (existing CRM data preserved; only empty fields filled; campaign link ensured).
   - **Create Scorecard Response** (idempotent by `Response ID`).
   - **Create Intent Event** `Scorecard Completed` (distinct from firmographic fit).
5. Booking click → `event` route creates `Booking Page Viewed`. A real booking integration would add `Discovery Booked`.

## Airtable mappings (base `appezuvIZLMwAFnFB`)

Field-name mapping is centralized and editable in
`packages/integrations/src/airtable.ts` (`AIRTABLE_FIELDS`). Writes use
`typecast: true` so single-selects coerce without option ids.

| Table | ID | Used for |
| --- | --- | --- |
| 🧲 Leads | `tblHxq81EcZtduR5T` | upsert by Email; link 📣 Marketing Campaigns → `recfZeWhsImzp0Cxc` |
| 🧮 Advisor Scorecard Responses | `tbl73qC0rKOwZwMCu` | one per submission (dedupe by Response ID); links Lead, Campaign, Lead Magnet `recZqIoAntR6njY4N` |
| 🎯 Intent & Attribution Events | `tblvhrV2lgbrZ3Ch8` | Scorecard Completed / Booking Page Viewed / Discovery Booked |

## Environment variables

Server-side only (see `.env.example`): `AIRTABLE_ACCESS_TOKEN` (**secret**),
`AIRTABLE_API_BASE_URL`, `AIRTABLE_BASE_ID`, `AIRTABLE_LEADS_TABLE_ID`,
`AIRTABLE_SCORECARD_RESPONSES_TABLE_ID`, `AIRTABLE_INTENT_EVENTS_TABLE_ID`,
`AION_FINANCIAL_ADVISOR_CAMPAIGN_RECORD_ID`, `AION_ADVISOR_SCORECARD_ASSET_RECORD_ID`,
`ADVISOR_GROWTH_REVIEW_URL`. The token is never exposed to the browser; the ID
defaults live server-side in `@aion/integrations`, so no Airtable identifiers ship
in the client bundle.

## Local development

```bash
pnpm install
pnpm --filter @aion/web dev      # open http://localhost:3000/advisor-scorecard
pnpm --filter @aion/scorecard test
```

Demo default (`DEMO_MODE=true`) writes nothing. To exercise real Airtable writes,
set `DEMO_MODE=false` and provide `AIRTABLE_ACCESS_TOKEN` (verify field names
against your base first).

## Demo / Client Zero mode

- `DEMO_MODE=true` → the funnel works fully but **no CRM records are written** (banner shown on results).
- `/advisor-scorecard?sample=1` → deterministic Marcus Johnson / Johnson Wealth Planning result (25 monthly leads, HubSpot) — 57 / Conversion Gaps, Follow-Up & Nurture leak.
- No live messaging, no destructive operations.

## QA checklist

- [ ] Landing renders headline, benefits, CTA, and the "not financial advice" trust copy.
- [ ] 18 questions, one at a time, with progress + back/continue; answer required to continue.
- [ ] Progress persists across a refresh; restart clears it.
- [ ] Contact requires name/email/company; consent checkbox is **unchecked** by default.
- [ ] Results show score, band, six sections, primary leak, strengths, 3 findings, first fix, 30-day plan, both CTAs.
- [ ] Perfect answers = 100 / Optimized; zero = 0 / Critical.
- [ ] Demo mode shows "no CRM records were written".
- [ ] Client bundle contains no Airtable identifiers/secrets (`grep -r "airtable.com" apps/web/.next/static` → none).
- [ ] Mobile (390px) and desktop both clean.

## Deployment checklist

- [ ] `DEMO_MODE=false` and `AIRTABLE_ACCESS_TOKEN` set in the server env (never `NEXT_PUBLIC_*`).
- [ ] Airtable field names verified against the live base (adjust `AIRTABLE_FIELDS` if renamed).
- [ ] `ADVISOR_GROWTH_REVIEW_URL` set to the real scheduling link.
- [ ] Campaign/asset record IDs confirmed.
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm test` green.

## Recommended next build

Scorecard → intent-based nurture → discovery booking (`Discovery Booked` event)
→ Advisor Brief delivery → ROI Business Case → personalized demo generation.
Not started here — this ships the scorecard MVP only.
