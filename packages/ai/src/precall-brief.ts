/**
 * Pre-call Advisor Brief — deterministic call preparation.
 *
 * When a lead books an appointment, the advisor should walk in already knowing
 * who they are and what to do. This turns the qualification data into a
 * reliable, no-LLM prep sheet that answers the exact questions an advisor asks
 * before a call:
 *
 *   Who is this? · Why did they come? · What problem did they identify? ·
 *   Score · Primary concern · Urgency · What should I ask? ·
 *   What should I avoid assuming?
 *
 * This is lead PREPARATION, not lead generation. Deterministic so it is always
 * available (no provider dependency) and always the same for the same inputs.
 */
import type { IndustryVertical, QualificationResult } from '@aion/types';

export interface PreCallBriefInput {
  firstName: string;
  lastName: string;
  role?: string | null;
  company?: string | null;
  state?: string | null;
  vertical: IndustryVertical;
  score: number;
  scoreBand: string;
  /** Lead source (e.g. "landing_page", "referral"). */
  source?: string | null;
  /** Entry point label (e.g. "Financial Protection Checkup"). */
  entryPoint?: string | null;
  /** The scheduled appointment title, if any. */
  appointmentTitle?: string | null;
  qualification?: QualificationResult | null;
  /** Raw qualification answers, used to enrich "why they came". */
  answers?: Record<string, unknown>;
}

export type UrgencyLevel = 'high' | 'medium' | 'low';

export interface PreCallBrief {
  /** Who is this? */
  who: string;
  /** Why did they come? */
  whyTheyCame: string;
  /** What problem did they identify? */
  problemIdentified: string;
  score: number;
  scoreBand: string;
  /** Primary concern (the single thing most on their mind). */
  primaryConcern: string;
  urgency: { level: UrgencyLevel; label: string; score: number };
  /** What should I ask? */
  questionsToAsk: string[];
  /** What should I avoid assuming? */
  avoidAssuming: string[];
  source: string;
  /** Always true — the advisor makes the call, this is prep only. */
  requiresAdvisorReview: true;
}

const VERTICAL_NOUN: Record<IndustryVertical, string> = {
  financial_advisor: 'financial-protection prospect',
  health_insurance: 'health-coverage prospect',
};

const prettySource = (s?: string | null): string =>
  !s ? 'Direct / unknown' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function urgencyFromScore(score: number): { level: UrgencyLevel; label: string } {
  if (score >= 70) return { level: 'high', label: 'High — engage within the hour' };
  if (score >= 45) return { level: 'medium', label: 'Medium — reach out today' };
  return { level: 'low', label: 'Low — nurture and stay available' };
}

/** The first non-empty string from the raw answers matching any of the keys. */
function answerText(answers: Record<string, unknown> | undefined, keys: string[]): string | undefined {
  if (!answers) return undefined;
  for (const k of keys) {
    const v = answers[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

export function generatePreCallBrief(input: PreCallBriefInput): PreCallBrief {
  const q = input.qualification ?? null;
  const name = `${input.firstName} ${input.lastName}`.trim();
  const interests = q?.productInterests ?? [];
  const entry = input.entryPoint || input.appointmentTitle || 'an inbound inquiry';

  // Who is this?
  const roleFirm = [input.role, input.company].filter(Boolean).join(' at ');
  const who = [
    `${name}${roleFirm ? ` — ${roleFirm}` : ''}`,
    `${VERTICAL_NOUN[input.vertical]}${input.state ? ` in ${input.state}` : ''}.`,
  ].join(' · ');

  // Why did they come?
  const concernAnswer = answerText(input.answers, [
    'financial_concerns',
    'primary_goal',
    'reason',
    'coverage_reason',
  ]);
  const whyTheyCame = concernAnswer
    ? `Came in via ${entry}: “${concernAnswer}”.`
    : interests.length > 0
      ? `Came in via ${entry}, interested in ${interests.slice(0, 2).join(' and ')}.`
      : `Came in via ${entry} (source: ${prettySource(input.source)}).`;

  // What problem did they identify?
  const problemIdentified =
    q?.needsSummary?.trim() ||
    (interests.length > 0
      ? `Looking for help with ${interests.join(', ')}.`
      : 'No structured problem captured yet — confirm their goal on the call.');

  // Primary concern
  const primaryConcern = interests[0] || concernAnswer || 'To be confirmed on the call';

  // Urgency
  const urgencyScore = q?.urgencyScore ?? Math.round(input.score * 0.6);
  const urgency = { ...urgencyFromScore(urgencyScore), score: urgencyScore };

  // What should I ask? — missing info first, then interest- and vertical-driven.
  const questionsToAsk: string[] = [];
  for (const m of q?.missingInformation ?? []) {
    questionsToAsk.push(`Clarify: ${m.toLowerCase()}.`);
  }
  if (interests[0]) questionsToAsk.push(`What’s prompting the interest in ${interests[0].toLowerCase()} now?`);
  questionsToAsk.push(
    input.vertical === 'financial_advisor'
      ? 'What protection or planning do they already have in place, and where do they feel exposed?'
      : 'What coverage do they have today, and what’s changing (renewal, life event, costs)?',
  );
  questionsToAsk.push('What does a good outcome from this conversation look like for them?');
  if (q?.appointmentReady === false) {
    questionsToAsk.push('Confirm decision timeline and who else is involved in the decision.');
  }

  // What should I avoid assuming? — objections, gaps, and a standing guardrail.
  const avoidAssuming: string[] = [];
  for (const o of q?.objections ?? []) {
    avoidAssuming.push(`Don’t assume the objection is resolved: “${o}”.`);
  }
  if ((q?.missingInformation ?? []).some((m) => /budget/i.test(m))) {
    avoidAssuming.push('Don’t assume a budget — they didn’t specify one.');
  }
  if (urgency.level !== 'high') {
    avoidAssuming.push('Don’t assume they’re ready to buy today — lead with discovery, not a pitch.');
  }
  avoidAssuming.push(
    'Don’t give specific financial, investment, tax, or insurance-product advice before a suitability review.',
  );

  return {
    who,
    whyTheyCame,
    problemIdentified,
    score: input.score,
    scoreBand: input.scoreBand,
    primaryConcern,
    urgency,
    questionsToAsk,
    avoidAssuming,
    source: prettySource(input.source),
    requiresAdvisorReview: true,
  };
}

/** Render the brief as a readable plain-text block (for logs / delivery). */
export function renderPreCallBriefText(b: PreCallBrief): string {
  return [
    `PRE-CALL ADVISOR BRIEF`,
    `Who is this?           ${b.who}`,
    `Why did they come?     ${b.whyTheyCame}`,
    `Problem identified:    ${b.problemIdentified}`,
    `Score:                 ${b.score} / 100 (${b.scoreBand})`,
    `Primary concern:       ${b.primaryConcern}`,
    `Urgency:               ${b.urgency.label} (${b.urgency.score})`,
    `What should I ask?`,
    ...b.questionsToAsk.map((q) => `  - ${q}`),
    `What should I avoid assuming?`,
    ...b.avoidAssuming.map((a) => `  - ${a}`),
    ``,
    `Advisor review required — this is call preparation, not advice.`,
  ].join('\n');
}
