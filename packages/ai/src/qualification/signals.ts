/**
 * Deterministic extraction of scoring signals from qualification answers.
 * This bridges the qualification form to the rule-based scoring engine without
 * involving AI, so the score is reproducible and auditable.
 */
import type { IndustryVertical, ScoreCategory } from '@aion/types';
import { clamp } from '@aion/shared';
import type { ScoreSignals } from '../scoring.js';

type Answers = Record<string, unknown>;

const URGENCY_MAP: Record<string, number> = {
  ASAP: 100,
  'This week': 80,
  'This month': 55,
  'Just researching': 20,
};

const ASSETS_MAP: Record<string, number> = {
  '<$50k': 20,
  '$50k-$249k': 45,
  '$250k-$999k': 70,
  '$1M-$4.9M': 90,
  '$5M+': 100,
};

const INCOME_MAP: Record<string, number> = {
  '<$50k': 20,
  '$50k-$99k': 45,
  '$100k-$199k': 65,
  '$200k-$499k': 85,
  '$500k+': 100,
  '<$20k': 15,
  '$20k-$39k': 35,
  '$40k-$79k': 55,
  '$80k-$149k': 75,
  '$150k+': 95,
};

function bool(v: unknown): boolean {
  return v === true || v === 'true' || v === 'yes';
}

function completeness(answers: Answers, total: number): number {
  const filled = Object.values(answers).filter(
    (v) => v !== undefined && v !== null && v !== '',
  ).length;
  return clamp((filled / Math.max(total, 1)) * 100, 0, 100);
}

export function extractSignals(
  vertical: IndustryVertical,
  answers: Answers,
  totalQuestions: number,
): Partial<ScoreSignals> {
  const urgency = URGENCY_MAP[String(answers.appointment_urgency ?? '')] ?? 40;
  const complete = completeness(answers, totalQuestions);

  const financialPotential =
    vertical === 'financial_advisor'
      ? ASSETS_MAP[String(answers.investable_assets ?? '')] ??
        INCOME_MAP[String(answers.household_income ?? '')] ??
        40
      : INCOME_MAP[String(answers.expected_income ?? '')] ?? 40;

  // Fit: presence of relevant needs increases fit.
  const needsFlags =
    vertical === 'financial_advisor'
      ? [
          bool(answers.estate_planning_needs),
          bool(answers.college_planning_needs),
          bool(answers.tax_planning_interest),
          !bool(answers.existing_advisor),
        ]
      : [
          bool(answers.medicare_eligible),
          bool(answers.chronic_care),
          bool(answers.dental_vision_interest),
          String(answers.current_coverage) === 'Uninsured',
        ];
  const fit = clamp(40 + needsFlags.filter(Boolean).length * 15, 0, 100);

  const eligibility =
    vertical === 'health_insurance'
      ? answers.state && answers.age_range
        ? 80
        : 40
      : answers.age_range
        ? 70
        : 40;

  const signals: Partial<Record<ScoreCategory, number>> = {
    intent: clamp(urgency * 0.7 + fit * 0.3, 0, 100),
    urgency,
    fit,
    engagement: 50,
    completeness: complete,
    appointment_readiness: urgency >= 55 && complete >= 60 ? 85 : 45,
    financial_potential: financialPotential,
    product_eligibility: eligibility,
    response_activity: 50,
    referral_quality: 50,
  };

  return signals;
}
