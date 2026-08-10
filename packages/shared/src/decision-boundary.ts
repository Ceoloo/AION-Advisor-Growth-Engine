/**
 * The rules-vs-AI decision boundary — an explicit architectural principle.
 *
 * The deterministic engine is a strength: it is safer, cheaper, and easier to
 * debug. So the split is deliberate and enforced (see the architecture test):
 *
 *   RULES decide.  AI describes.
 *
 * Anything that must be correct, reproducible, auditable, or compliance-bearing
 * is rule-based. AI is reserved for language: summarizing, personalizing, and
 * drafting — always over a deterministic base, never as the source of truth.
 *
 * This module is the single source of truth for that boundary; the manifest is
 * consumed by docs and by the architecture test that asserts rule-based domains
 * make no LLM calls.
 */

export type EngineKind = 'rules' | 'ai';

export type Capability =
  // --- Rule-based (deterministic) -------------------------------------------
  | 'scoring'
  | 'qualification'
  | 'routing'
  | 'compliance'
  | 'consent'
  | 'lifecycle_state'
  | 'kpi_calculations'
  // --- AI-assisted (language) ------------------------------------------------
  | 'summarization'
  | 'personalization'
  | 'advisor_briefs'
  | 'recommendations'
  | 'content_variations'
  | 'sales_call_preparation'
  | 'pattern_detection';

export interface CapabilityPolicy {
  capability: Capability;
  engine: EngineKind;
  label: string;
  rationale: string;
}

export const CAPABILITY_ENGINE: Record<Capability, CapabilityPolicy> = {
  // Rules — must be correct, reproducible, and auditable.
  scoring: {
    capability: 'scoring',
    engine: 'rules',
    label: 'Lead scoring',
    rationale: 'Deterministic and explainable — the same inputs must always yield the same score.',
  },
  qualification: {
    capability: 'qualification',
    engine: 'rules',
    label: 'Qualification',
    rationale: 'Rule-based thresholds so qualification is reproducible and defensible.',
  },
  routing: {
    capability: 'routing',
    engine: 'rules',
    label: 'Lead routing / assignment',
    rationale: 'Round-robin / ownership rules — predictable, no model in the loop.',
  },
  compliance: {
    capability: 'compliance',
    engine: 'rules',
    label: 'Compliance & launch gates',
    rationale: 'Approvals and blocks are hard logic; a model must never decide what is compliant.',
  },
  consent: {
    capability: 'consent',
    engine: 'rules',
    label: 'Consent enforcement',
    rationale: 'Consent is a legal state check, not a judgement call.',
  },
  lifecycle_state: {
    capability: 'lifecycle_state',
    engine: 'rules',
    label: 'Lifecycle / pipeline state',
    rationale: 'State transitions are deterministic and auditable.',
  },
  kpi_calculations: {
    capability: 'kpi_calculations',
    engine: 'rules',
    label: 'KPI & funnel calculations',
    rationale: 'Metrics must be exact and reproducible — no estimation by a model.',
  },

  // AI — language over a deterministic base. Never the source of truth.
  summarization: {
    capability: 'summarization',
    engine: 'ai',
    label: 'Summarization',
    rationale: 'Condensing conversations/records into prose is a language task.',
  },
  personalization: {
    capability: 'personalization',
    engine: 'ai',
    label: 'Personalization',
    rationale: 'Tailoring tone and wording to a lead is generative, not decision-making.',
  },
  advisor_briefs: {
    capability: 'advisor_briefs',
    engine: 'ai',
    label: 'Advisor briefs (narrative)',
    rationale:
      'The FACTS in a pre-call brief are rules (deterministic today); the optional narrative — ' +
      'talking points, phrasing — is the AI layer over that base.',
  },
  recommendations: {
    capability: 'recommendations',
    engine: 'ai',
    label: 'Recommendations',
    rationale: 'Suggested next actions/products are advisory language; a human decides.',
  },
  content_variations: {
    capability: 'content_variations',
    engine: 'ai',
    label: 'Content variations',
    rationale: 'Generating message/copy variants is a creative language task.',
  },
  sales_call_preparation: {
    capability: 'sales_call_preparation',
    engine: 'ai',
    label: 'Sales-call preparation (narrative)',
    rationale:
      'The structured prep (who/score/urgency/what-to-ask) is deterministic; AI enriches the ' +
      'narrative and coaching around it.',
  },
  pattern_detection: {
    capability: 'pattern_detection',
    engine: 'ai',
    label: 'Pattern detection',
    rationale: 'Surfacing soft patterns/insights is probabilistic; findings are human-reviewed.',
  },
};

export const RULE_BASED_CAPABILITIES: Capability[] = Object.values(CAPABILITY_ENGINE)
  .filter((p) => p.engine === 'rules')
  .map((p) => p.capability);

export const AI_CAPABILITIES: Capability[] = Object.values(CAPABILITY_ENGINE)
  .filter((p) => p.engine === 'ai')
  .map((p) => p.capability);

export function engineFor(capability: Capability): EngineKind {
  return CAPABILITY_ENGINE[capability].engine;
}

export function isRuleBased(capability: Capability): boolean {
  return engineFor(capability) === 'rules';
}

export function isAiAssisted(capability: Capability): boolean {
  return engineFor(capability) === 'ai';
}
