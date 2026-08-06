# AI Intelligence Layer

`@aion/ai` is a **provider-agnostic** AI layer. The rest of the platform depends
only on the gateway and Zod schemas — never on a vendor SDK. Swapping providers
is a configuration change (`AI_PROVIDER`).

## Golden rules

1. **AI output is never trusted without schema validation.** Every structured
   call runs through `AIGateway.generateStructured(schema, request)`, which
   returns `{ ok: false }` on any parse/validation failure — it never leaks
   malformed data to callers.
2. **AI never triggers irreversible actions unattended.** Results feed workflow
   rules or human approval. Outbound message drafts carry `requiresApproval`.
3. **Scoring is not AI.** The lead score is a deterministic, rule-based function
   so it is explainable and reproducible.

## Gateway & providers

```ts
const gateway = new AIGateway(createProvider({ provider: 'mock' | 'openai' | 'anthropic', model, ... }));
const result = await gateway.generateStructured(LeadQualificationResultSchema, { system, prompt });
```

- **Mock provider** (`AI_PROVIDER=mock`, default): deterministic canned outputs keyed by an embedded task token (e.g. `[[TASK:qualification]]`). Zero external calls — powers demo mode and tests.
- **OpenAI / Anthropic**: thin `fetch` wrappers (no SDK dependency). They fall back to the mock provider when no API key is present, keeping the demo runnable.
- **Usage accounting**: every call reports `{ provider, model, inputTokens, outputTokens, costUsd }` via the gateway's `onUsage` hook → `api_usage_logs`.

## Modules (`engines.ts`)

`qualifyLead`, `summarizeNeeds`, `generateAdvisorBrief`, `generateFollowUp`,
`summarizeConversation`, `nextBestAction`, `checkComplianceLanguage`. Each embeds
a compliance guardrail in the system prompt and validates output against a schema
in `schemas.ts`:

- `LeadQualificationResultSchema`, `NeedsProfileSummarySchema`, `AdvisorPrepBriefSchema`,
  `FollowUpMessageSchema`, `ConversationSummarySchema`, `NextBestActionSchema`, `ComplianceCheckSchema`.

Example:

```ts
const LeadQualificationResultSchema = z.object({
  qualificationStatus: z.enum(['unqualified', 'nurture', 'qualified', 'high_priority']),
  intentScore: z.number().min(0).max(100),
  urgencyScore: z.number().min(0).max(100),
  productInterests: z.array(z.string()),
  needsSummary: z.string(),
  objections: z.array(z.string()),
  missingInformation: z.array(z.string()),
  recommendedNextAction: z.string(),
  appointmentReady: z.boolean(),
});
```

## Lead scoring (`scoring.ts`)

Deterministic, configurable, explainable. Ten categories — intent, urgency, fit,
engagement, completeness, appointment readiness, financial potential, product
eligibility, response activity, referral quality — each normalized to 0–100,
combined with per-organization weights into a 0–100 total and a band:

| Band | Score |
| --- | --- |
| Low priority | 0–29 |
| Nurture | 30–54 |
| Qualified | 55–74 |
| High priority | 75–89 |
| Immediate follow-up | 90–100 |

Weights and thresholds live in `organization_settings` and default to
`DEFAULT_WEIGHTS` / `DEFAULT_BAND_THRESHOLDS`. `computeScore` normalizes weights
defensively so a misconfiguration can never push the total out of range. Both the
total and the full breakdown are stored (`lead_scores`).

## Qualification templates

Two industry templates (`qualification/templates.ts`) — Financial Advisor and
Health Insurance — drive the dynamic forms and, via `qualification/signals.ts`,
the deterministic scoring signals. Sensitive fields are flagged so they can be
masked in logs.

## Going live

Set `AI_PROVIDER=openai|anthropic` and the matching API key. No caller changes
are required — the gateway and schemas are identical across providers. Add new
providers by implementing the small `AIProvider` interface.
