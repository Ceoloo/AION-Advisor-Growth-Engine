import { describe, expect, it } from 'vitest';
import { computeScorecard } from '../scoring.js';
import { DEMO_ANSWERS, DEMO_CONTACT } from '../demo.js';
import {
  intentTierFor,
  accumulateIntent,
  computeNurturePlan,
  INTENT_TIER_THRESHOLDS,
} from '../nurture.js';
import { computeRoiBusinessCase, DEFAULT_ASSUMED_LEAD_VOLUME } from '../roi.js';
import { generatePersonalizedProposal, PROPOSAL_PLANS } from '../proposal.js';

const result = computeScorecard(DEMO_ANSWERS); // 57, Follow-Up leak

describe('intent tiers', () => {
  it('maps points to tiers at thresholds', () => {
    expect(intentTierFor(0)).toBe('cold');
    expect(intentTierFor(INTENT_TIER_THRESHOLDS.nurture)).toBe('nurture');
    expect(intentTierFor(INTENT_TIER_THRESHOLDS.warm)).toBe('warm');
    expect(intentTierFor(INTENT_TIER_THRESHOLDS.hot)).toBe('hot');
    expect(intentTierFor(1000)).toBe('hot');
  });

  it('adds a priority boost to accumulated intent', () => {
    const base = accumulateIntent(['Scorecard Completed']);
    const boosted = accumulateIntent(['Scorecard Completed'], 'Immediate');
    expect(boosted).toBeGreaterThan(base);
  });
});

describe('nurture plan', () => {
  it('fast-tracks hot intent and long-term-nurtures cold intent', () => {
    const hot = computeNurturePlan({
      result,
      growthPriority: 'Immediate',
      events: ['Scorecard Completed', 'Booking Page Viewed'],
    });
    expect(hot.tier).toBe('hot');
    expect(hot.track).toBe('fast_track_review');

    const cold = computeNurturePlan({ result, growthPriority: 'Exploring', events: [] });
    expect(cold.track).toBe('long_term_nurture');
    expect(cold.stopsOn).toContain('opt_out');
    expect(cold.nextActions.length).toBeGreaterThan(0);
    expect(cold.cadenceDays[0]).toBe(0);
  });
});

describe('ROI business case', () => {
  it('is deterministic and illustrative', () => {
    const a = computeRoiBusinessCase(25, result);
    const b = computeRoiBusinessCase(25, result);
    expect(a).toEqual(b);
    expect(a.illustrative).toBe(true);
    expect(a.monthlyLeadVolume).toBe(25);
    expect(a.assumedLeadVolume).toBe(false);
    expect(a.note).toMatch(/not a guarantee/i);
  });

  it('assumes a lead volume when none is provided', () => {
    const r = computeRoiBusinessCase(undefined, result);
    expect(r.assumedLeadVolume).toBe(true);
    expect(r.monthlyLeadVolume).toBe(DEFAULT_ASSUMED_LEAD_VOLUME);
  });

  it('produces a non-negative uplift and maps the leak to a funnel metric', () => {
    const r = computeRoiBusinessCase(25, result);
    expect(r.uplift.additionalClientsPerYear).toBeGreaterThanOrEqual(0);
    expect(r.uplift.annualRevenueLow).toBeLessThanOrEqual(r.uplift.annualRevenueLikely);
    expect(r.targetMetric).toBe('lead_to_appointment'); // follow-up leak
  });

  it('never divides by zero at zero leads', () => {
    const r = computeRoiBusinessCase(0, result);
    expect(Number.isFinite(r.uplift.annualRevenueLikely)).toBe(true);
  });
});

describe('personalized proposal', () => {
  it('assembles recap, ROI, nurture, plan, and disclaimers', () => {
    const p = generatePersonalizedProposal(DEMO_CONTACT, result);
    expect(p.scoreRecap.total).toBe(57);
    expect(p.scoreRecap.primaryLeak).toBe('Follow-Up & Nurture');
    expect(p.topFindings.length).toBe(3);
    expect(p.roi.illustrative).toBe(true);
    expect(p.disclaimers.join(' ')).toMatch(/does not provide financial/i);
  });

  it('recommends the Pilot by default and Growth for high-volume immediate buyers', () => {
    const pilot = generatePersonalizedProposal(DEMO_CONTACT, result);
    expect(pilot.recommendedPlan.key).toBe('pilot');
    expect(pilot.anchorPlan.key).toBe('growth');

    const growth = generatePersonalizedProposal(
      { ...DEMO_CONTACT, monthlyLeadVolume: 120, growthPriority: 'Immediate' },
      result,
    );
    expect(growth.recommendedPlan.key).toBe('growth');
  });

  it('plan prices match the pricing screen', () => {
    expect(PROPOSAL_PLANS.pilot.setup).toBe(4500);
    expect(PROPOSAL_PLANS.pilot.monthly).toBe(997);
    expect(PROPOSAL_PLANS.growth.setup).toBe(7500);
    expect(PROPOSAL_PLANS.growth.monthly).toBe(1497);
  });
});
