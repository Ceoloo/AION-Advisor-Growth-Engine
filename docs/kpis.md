# KPI layer — the revenue funnel

Ben doesn't care that we built an 18-question quiz. He cares about one thing:

> **Did I get more qualified opportunities and revenue?**

So the dashboard measures the whole funnel he actually judges the pilot by, and —
most importantly — shows **Baseline vs Pilot** (before vs after AION). That
comparison is what becomes the testimonial.

Engine: [`@aion/analytics/funnel.ts`](../packages/analytics/src/funnel.ts).
Live at **`/dashboard`** and **`GET /api/metrics`**.

---

## The funnel

```
Traffic → Leads → Qualified → Appointments → Showed →
Consultations → Opportunities → Clients → Verified Revenue
```

Each countable stage is a **subset of the previous**, so the funnel is a clean
monotonic chain (no stage can exceed the one above it). Definitions, from the
tenant's records:

| Stage | Definition |
| --- | --- |
| **Traffic** | Σ campaign visits (top-of-funnel sessions). |
| **Leads** | All leads. |
| **Qualified** | Leads with qualification status `qualified` or `high_priority`. |
| **Appointments** | Unique leads with a non-cancelled appointment (booked). |
| **Showed** | Unique booked leads whose appointment is `completed` (attended). |
| **Consultations** | Showed leads where a deal was discussed (an opportunity or close exists). |
| **Opportunities** | Consultations with an active/won deal (lost/abandoned drop out). |
| **Clients** | Opportunities that closed (lead is a client / has an issued policy). |
| **Verified Revenue** | Σ premiums of issued (active/renewed) policies — real, closed revenue. |

## Conversion & operational metrics

Between-stage rates (the ones Ben names):

- **Lead → Qualified**, **Qualified → Booked**, **Booked → Show**,
  **Show → Next step** (showed → consultation), **Lead → Client**.

Operational:

- **First-response time** — for the pilot this is derived from the client's
  follow-up cadence (the first step's delay, floored to a few minutes to reflect
  automated instant outreach); the baseline carries the advisor's prior manual
  number.
- **Cost per lead** and **cost per qualified lead** (marketing spend ÷ stage).
- **Pipeline value** — Σ open-opportunity value.
- **Verified revenue** — issued-policy premiums.
- **Source conversion** — per lead source: leads, qualified %, client %.
- **Campaign conversion** — per campaign: visits, leads, visit→lead %, CPL.

## Baseline vs Pilot (the testimonial)

Every advisor's [`ClientConfig`](client-configuration.md) carries a **`baseline`**
`FunnelSnapshot` — the pre-AION funnel from their prior 30 days. The dashboard
computes the live **pilot** snapshot ("AFTER AION") and compares:

```
                  BEFORE AION      AFTER AION
────────────      ───────────      ──────────
Leads             24               33          (+38%)
Qualified          9               22          (+144%)
Appointments       4               11          (+175%)
Showed             2                3          (+50%)
Consultations      1                3          (+200%)
Opportunities      1                3          (+200%)
Clients            0                1          (new)
Verified Revenue  $0             $710          (new)
First response   240 min           5 min       (−98%)
```

`compareFunnel(baseline, pilot)` returns per-stage `before` / `after` / `delta`
/ `liftPct` (null when the baseline stage is zero, shown as "new"), plus
percentage-point deltas on each rate and the response-time change.

The comparison only renders when the client has a recorded baseline; a brand-new
advisor simply shows the live funnel until their baseline is captured.

## API

```bash
curl -s http://localhost:3000/api/metrics | jq
```

Returns `funnel` (the 9 stages with step conversions), `conversions`,
`responseTimeMinutes`, `costPerLead`, `costPerQualifiedLead`, `pipelineValue`,
`verifiedRevenue`, `sources`, `campaigns`, and `comparison` (baseline vs pilot).
Read-only — it reflects the active tenant's live data.
