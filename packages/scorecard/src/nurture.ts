/**
 * Intent-based nurture. Deterministic (no LLM, no side effects): given the
 * accumulated intent signal and the diagnosis, decide the nurture track, tier,
 * cadence, and next actions. This does NOT send anything — it produces a plan
 * that a workflow or a human executes through an approved channel. Scorecard
 * completion is a real intent signal but is kept DISTINCT from firmographic fit.
 */
import { INTENT_POINTS, type IntentEventType } from './intent.js';
import type { GrowthPriority, ScorecardResult } from './types.js';
import { SECTIONS } from './sections.js';

export type IntentTier = 'cold' | 'nurture' | 'warm' | 'hot';

/** Lower bound (inclusive) of accumulated intent points per tier. */
export const INTENT_TIER_THRESHOLDS: Record<IntentTier, number> = {
  cold: 0,
  nurture: 10,
  warm: 30,
  hot: 60,
};

/** Extra intent weight from a stated growth priority (buying-timeline signal). */
export const PRIORITY_INTENT_BOOST: Record<GrowthPriority, number> = {
  Immediate: 30,
  '30 Days': 20,
  '60–90 Days': 10,
  Exploring: 0,
};

export function intentTierFor(points: number): IntentTier {
  const ordered = (Object.entries(INTENT_TIER_THRESHOLDS) as [IntentTier, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  for (const [tier, min] of ordered) if (points >= min) return tier;
  return 'cold';
}

/** Sum intent points for a set of events that have occurred. */
export function accumulateIntent(events: IntentEventType[], priority?: GrowthPriority): number {
  const base = events.reduce((sum, e) => sum + (INTENT_POINTS[e] ?? 0), 0);
  const boost = priority ? PRIORITY_INTENT_BOOST[priority] : 0;
  return base + boost;
}

export interface NurtureInput {
  result: ScorecardResult;
  growthPriority?: GrowthPriority;
  /** Intent events already recorded for this lead. */
  events?: IntentEventType[];
}

export interface NurturePlan {
  tier: IntentTier;
  intentPoints: number;
  /** Human-readable track key for routing. */
  track: 'fast_track_review' | 'priority_nurture' | 'educational_nurture' | 'long_term_nurture';
  trackLabel: string;
  /** Days after completion for each touch (behavior-aware; stops on real reply/booking). */
  cadenceDays: number[];
  nextActions: string[];
  stopsOn: string[];
}

const TRACK_LABEL: Record<NurturePlan['track'], string> = {
  fast_track_review: 'Fast-track to Advisor Growth Review',
  priority_nurture: 'Priority nurture',
  educational_nurture: 'Educational nurture',
  long_term_nurture: 'Long-term nurture',
};

export function computeNurturePlan(input: NurtureInput): NurturePlan {
  const events: IntentEventType[] = input.events ?? ['Scorecard Completed'];
  const intentPoints = accumulateIntent(events, input.growthPriority);
  const tier = intentTierFor(intentPoints);
  const leakLabel = input.result.primaryLeak.label;
  const firstFix = SECTIONS[input.result.leakSection].firstFix;

  const track: NurturePlan['track'] =
    tier === 'hot'
      ? 'fast_track_review'
      : tier === 'warm'
        ? 'priority_nurture'
        : tier === 'nurture'
          ? 'educational_nurture'
          : 'long_term_nurture';

  // Deterministic touch cadence per tier (behavior-aware; hotter = tighter).
  const cadenceDays =
    track === 'fast_track_review'
      ? [0, 1, 3]
      : track === 'priority_nurture'
        ? [0, 2, 5, 9]
        : track === 'educational_nurture'
          ? [0, 3, 7, 14, 24]
          : [0, 7, 21, 45];

  const nextActions =
    track === 'fast_track_review'
      ? [
          `Personal outreach referencing the ${leakLabel} leak and offer two review times.`,
          'Send the one-page result recap and the Advisor Growth Review booking link.',
          'If not booked, a brief nudge with the first-fix summary.',
        ]
      : track === 'priority_nurture'
        ? [
            `Send the result recap highlighting the ${leakLabel} leak.`,
            `Share a short resource on: ${firstFix}`,
            'Invite to the Advisor Growth Review with two proposed times.',
            'Value follow-up, then pause on reply/opt-out.',
          ]
        : track === 'educational_nurture'
          ? [
              'Deliver the result recap and set expectations.',
              `Educational touch on the ${leakLabel} section.`,
              'Case-style explainer of the first fix.',
              'Soft invite to a review when ready.',
              'Periodic value touch until intent rises.',
            ]
          : [
              'Deliver the result recap.',
              'Add to the long-term educational track.',
              'Re-surface when a relevant trigger or timeline arrives.',
              'Scheduled reactivation check-in.',
            ];

  return {
    tier,
    intentPoints,
    track,
    trackLabel: TRACK_LABEL[track],
    cadenceDays,
    nextActions,
    stopsOn: ['discovery_booked', 'genuine_reply', 'opt_out'],
  };
}
