# The AION measurement framework — Observed → Modeled → Verified

The ROI engine connects the scorecard to the commercial conversation, which
makes it powerful — and makes honesty about the numbers essential. Every figure
AION shows is tagged with its **provenance**, so a modeled projection can never
be mistaken for a measured fact or a verified outcome.

```
OBSERVED         →   MODELED            →   VERIFIED
measured facts       illustrative model     actual attributed outcomes
```

| Tier | Color | What it is | Examples |
| --- | --- | --- | --- |
| **Observed** | sky | Facts we actually measured | Lead volume (reported), real booking rate, real response time |
| **Modeled** | amber | An *illustrative* projection from assumptions — **not a guarantee** | Potential additional appointments, modeled opportunity, modeled annual upside |
| **Verified** | emerald | Actual attributed outcomes once the pilot runs | Actual appointments, opportunities, revenue attributed |

The arc is deliberate: we **start from what is measured**, **model** the upside
transparently (with editable assumptions on display), then **replace the model
with verified results** as the pilot produces real data.

## In the engine

`MeasurementTier` (`observed | modeled | verified`) lives in
[`@aion/types`](../packages/types/src/enums.ts). The ROI engine
([`@aion/scorecard/roi.ts`](../packages/scorecard/src/roi.ts)) returns a
`RoiBusinessCase` split into the three tiers:

```ts
{
  framework: 'observed_modeled_verified',
  observed: { tier: 'observed', monthlyLeadVolume, leadVolumeSource, bookingRate?, responseTimeMinutes? },
  modeled:  { tier: 'modeled', additionalAppointmentsPerMonth, additionalClientsPerYear,
              modeledAnnualUpside, annualRevenueLow, annualRevenueLikely, assumptions, … },
  verified: null | { tier: 'verified', appointments, opportunities, revenueAttributed, periodLabel },
  illustrative: true,
  note: 'The modeled figures are illustrative … not a guarantee … Verified results replace the model once the pilot runs.',
}
```

- **Observed** carries `leadVolumeSource: 'reported' | 'assumed'` so an assumed
  default is never shown as something the advisor told us. Real `bookingRate`
  and `responseTimeMinutes` fill in when live data exists.
- **Modeled** keeps its editable assumptions attached and is always labeled
  illustrative.
- **Verified** is `null` for a fresh prospect. It is populated from real
  outcomes via `computeRoiBusinessCase(vol, result, overrides, { observed, verified })`.

## In the UI

The proposal (`/advisor-scorecard/proposal`) renders the three tiers as visually
distinct blocks with a legend, using the shared
[`measurement-tier`](../apps/web/src/components/scorecard/measurement-tier.tsx)
component (fixed color per tier):

- **Observed** (sky) — the measured inputs.
- **Modeled** (amber) — the illustrative upside, with an "editable assumptions"
  disclosure and the not-a-guarantee note.
- **Verified** (emerald) — for a prospect, an honest pending state:
  *"Populated during your pilot from real appointments, opportunities, and
  attributed revenue — measured on the dashboard, not modeled here."*

## Where Verified comes from

The Verified tier is not invented by the ROI engine — it is the **actual funnel
outcome** measured by the KPI layer ([`docs/kpis.md`](kpis.md)): real
appointments, opportunities, and verified revenue from the client's live data.
That is the same "AFTER AION" data the dashboard's Baseline-vs-Pilot comparison
shows. So the loop closes:

> The scorecard **models** the opportunity → the pilot **verifies** it on the
> dashboard → the model is replaced by real, attributed results.
