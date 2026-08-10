# Pre-Call Advisor Brief — lead generation → lead preparation

Generating a brief is not enough; it has to land in the advisor's hands at the
moment it's useful. When a lead books, AION produces a **pre-call prep sheet**
that answers the eight questions an advisor actually asks before a call:

```
BOOKED
  ↓
Advisor Brief generated
  ↓
Ben receives:
  • Who is this?
  • Why did they come?
  • What problem did they identify?
  • Score
  • Primary concern
  • Urgency
  • What should I ask?
  • What should I avoid assuming?
```

That transforms **lead generation** into **lead preparation**.

Engine: [`@aion/ai/precall-brief.ts`](../packages/ai/src/precall-brief.ts). Seen
on the lead detail page, linked from every appointment, and served at
`GET /api/leads/:id/brief`.

---

## Deterministic by design

`generatePreCallBrief(input)` is pure and **LLM-free**, so the brief is always
available and identical for the same inputs — a rep can rely on it before every
call. It maps the lead's qualification data to the eight sections:

| Section | Source |
| --- | --- |
| **Who is this?** | name, role/firm, vertical, state |
| **Why did they come?** | funnel entry point + their own concern answer / product interests |
| **What problem did they identify?** | qualification `needsSummary` (falls back to interests) |
| **Score** | lead score + band |
| **Primary concern** | top product interest / stated concern |
| **Urgency** | derived from the qualification `urgencyScore` (≥70 high, ≥45 medium) |
| **What should I ask?** | `missingInformation` first, then interest- and vertical-specific prompts |
| **What should I avoid assuming?** | open `objections`, unstated budget, buying-readiness, **plus a standing compliance guardrail** |

Every brief carries `requiresAdvisorReview: true` and a disclaimer — it is call
**preparation**, never financial/tax/insurance-product advice. It degrades
gracefully: with no qualification data it still produces a usable "confirm their
goal on the call" brief.

## In the workflow

- **Trigger.** Booking is the trigger. Both the native scheduling `book` route
  and the scorecard `booking-confirmed` route emit a `workflow_execution`
  observability event — *"Pre-Call Advisor Brief generated on booking"* — right
  after the booking event, so the System Health board shows the brief step
  running.
- **Delivery.** The brief is rendered on the **lead detail** page (top of the
  column, once the lead has a booked appointment) and linked as **🧾 Pre-Call
  Brief** from every row on the **appointments** page. `renderPreCallBriefText`
  produces a plain-text version for logs / message delivery.
- **API.** `GET /api/leads/:id/brief` returns the structured brief (tenant-scoped;
  404 for an unknown lead).

## Example — Marcus Johnson

For the seeded pilot lead (score 86, high priority, Financial Protection
Checkup), the brief reads:

- **Who** — Marcus Johnson · financial-protection prospect in FL.
- **Why** — Came in via Financial Protection Checkup: "Protecting my family's
  income and leaving a clean legacy."
- **Problem** — wants to protect family income and leave a clean legacy.
- **Score** — 86/100 (high priority) · **Primary concern** — Income protection ·
  **Urgency** — High.
- **Ask** — clarify existing coverage amounts; what's prompting this now; what a
  good outcome looks like.
- **Avoid assuming** — the "understand fees clearly" objection is resolved;
  giving product advice before a suitability review.
