# The rules-vs-AI decision boundary

The deterministic engine is a strength — safer, cheaper, and easier to debug.
So AION draws a deliberate, **enforced** line:

> **Rules decide. AI describes.**

Anything that must be correct, reproducible, auditable, or compliance-bearing is
rule-based. AI is reserved for language — summarizing, personalizing, drafting —
always over a deterministic base, never as the source of truth.

Manifest: [`@aion/shared/decision-boundary.ts`](../packages/shared/src/decision-boundary.ts).
Enforced by [`tests/integration/decision-boundary.test.ts`](../tests/integration/decision-boundary.test.ts).

---

## The split

| Rule-based (deterministic) | AI-assisted (language) |
| --- | --- |
| Scoring | Summarization |
| Qualification | Personalization |
| Routing / assignment | Advisor briefs (narrative) |
| Compliance & launch gates | Recommendations |
| Consent enforcement | Content variations |
| Lifecycle / pipeline state | Sales-call preparation (narrative) |
| KPI & funnel calculations | Pattern detection |

Each capability's engine and rationale is declared in `CAPABILITY_ENGINE`;
`isRuleBased()` / `isAiAssisted()` / `engineFor()` read from it.

## Why this line

- **Correctness & reproducibility.** A score, a KPI, a qualification threshold
  must be identical for identical inputs. A model that drifts is a liability.
- **Auditability.** Compliance, consent, and lifecycle decisions have to be
  explainable to a regulator; rules are inspectable, prompts are not.
- **Cost & latency.** The deterministic path is free and instant — no provider
  round-trip in the hot path.
- **Debuggability.** When a rule is wrong you fix the rule; when a prompt is
  wrong you chase nondeterminism.

## The nuance: facts vs prose

Advisor briefs and sales-call prep appear under **AI** above, but their **facts
are rules**. The [pre-call Advisor Brief](advisor-brief.md) ships **deterministic
today** — who, score, urgency, what-to-ask are computed from the lead's own data
with no model. AI is the *optional layer on top*: narrative talking points, tone,
coaching. So the boundary within one feature is: **deterministic facts, AI
phrasing.** The facts are never generated.

## Enforcement

The architecture test asserts the rule-based packages — `@aion/scorecard`,
`@aion/compliance`, `@aion/analytics`, `@aion/scheduling`, `@aion/clients`,
`@aion/observability` — contain **no LLM calls**: they never import `@aion/ai`
or touch the AI gateway (`getGateway` / `generateStructured` / `AIGateway`). If
someone wires a model into scoring or compliance, the test fails.

This keeps the boundary honest as the codebase grows — the principle is code,
not a comment.
