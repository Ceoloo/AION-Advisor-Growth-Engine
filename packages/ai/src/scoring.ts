/**
 * Rule-based lead scoring engine.
 *
 * Deterministic by design: the same inputs and the same configured weights
 * always produce the same score and band. AI is NOT used here — scoring must be
 * explainable and reproducible for compliance. The AI qualification result can
 * feed signals into this engine, but the arithmetic is pure.
 */
import type { ScoreBand, ScoreCategory } from '@aion/types';
import { clamp, round } from '@aion/shared';

/** Per-category signals, each already normalized to 0–100 by the caller. */
export type ScoreSignals = Record<ScoreCategory, number>;

export const DEFAULT_WEIGHTS: Record<ScoreCategory, number> = {
  intent: 0.2,
  urgency: 0.15,
  fit: 0.15,
  engagement: 0.1,
  completeness: 0.05,
  appointment_readiness: 0.1,
  financial_potential: 0.1,
  product_eligibility: 0.05,
  response_activity: 0.05,
  referral_quality: 0.05,
};

/** Lower bound (inclusive) of each band. Configurable per organization. */
export const DEFAULT_BAND_THRESHOLDS: Record<ScoreBand, number> = {
  low_priority: 0,
  nurture: 30,
  qualified: 55,
  high_priority: 75,
  immediate_follow_up: 90,
};

export interface ScoreResult {
  total: number;
  band: ScoreBand;
  breakdown: Record<ScoreCategory, number>;
  ruleVersion: string;
}

const RULE_VERSION = 'score-v1';

export function bandForScore(
  total: number,
  thresholds: Record<ScoreBand, number> = DEFAULT_BAND_THRESHOLDS,
): ScoreBand {
  const ordered = (Object.entries(thresholds) as [ScoreBand, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  for (const [band, min] of ordered) {
    if (total >= min) return band;
  }
  return 'low_priority';
}

/**
 * Compute a weighted 0–100 score. Weights are normalized defensively so a
 * partial/misconfigured weight map can never push the total out of range.
 */
export function computeScore(
  signals: Partial<ScoreSignals>,
  weights: Partial<Record<ScoreCategory, number>> = DEFAULT_WEIGHTS,
  thresholds: Record<ScoreBand, number> = DEFAULT_BAND_THRESHOLDS,
): ScoreResult {
  const effectiveWeights = { ...DEFAULT_WEIGHTS, ...weights };
  const weightSum =
    Object.values(effectiveWeights).reduce((a, b) => a + (b > 0 ? b : 0), 0) || 1;

  const breakdown = {} as Record<ScoreCategory, number>;
  let weighted = 0;

  for (const category of Object.keys(DEFAULT_WEIGHTS) as ScoreCategory[]) {
    const raw = clamp(signals[category] ?? 0, 0, 100);
    breakdown[category] = round(raw, 1);
    const w = effectiveWeights[category] / weightSum;
    weighted += raw * w;
  }

  const total = Math.round(clamp(weighted, 0, 100));
  return { total, band: bandForScore(total, thresholds), breakdown, ruleVersion: RULE_VERSION };
}
