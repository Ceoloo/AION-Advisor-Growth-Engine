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

describe('ROI business case — Observed → Modeled → Verified', () => {
  it('is deterministic and illustrative', () => {
    const a = computeRoiBusinessCase(25, result);
    const b = computeRoiBusinessCase(25, result);
    expect(a).toEqual(b);
    expect(a.framework).toBe('observed_modeled_verified');
    expect(a.illustrative).toBe(true);
    expect(a.note).toMatch(/not a guarantee/i);
  });

  it('records reported lead volume in the OBSERVED tier', () => {
    const r = computeRoiBusinessCase(25, result);
    expect(r.observed.tier).toBe('observed');
    expect(r.observed.monthlyLeadVolume).toBe(25);
    expect(r.observed.leadVolumeSource).toBe('reported');
  });

  it('marks lead volume as assumed when none is provided', () => {
    const r = computeRoiBusinessCase(undefined, result);
    expect(r.observed.leadVolumeSource).toBe('assumed');
    expect(r.observed.monthlyLeadVolume).toBe(DEFAULT_ASSUMED_LEAD_VOLUME);
    expect(r.assumedLeadVolume).toBe(true);
  });

  it('produces a non-negative MODELED uplift and maps the leak to a funnel metric', () => {
    const r = computeRoiBusinessCase(25, result);
    expect(r.modeled.tier).toBe('modeled');
    expect(r.modeled.additionalAppointmentsPerMonth).toBeGreaterThanOrEqual(0);
    expect(r.modeled.additionalClientsPerYear).toBeGreaterThanOrEqual(0);
    expect(r.modeled.annualRevenueLow).toBeLessThanOrEqual(r.modeled.annualRevenueLikely);
    expect(r.modeled.modeledAnnualUpside).toBe(r.modeled.annualRevenueLikely);
    expect(r.targetMetric).toBe('lead_to_appointment'); // follow-up leak
  });

  it('has no VERIFIED tier for a fresh prospect', () => {
    expect(computeRoiBusinessCase(25, result).verified).toBeNull();
  });

  it('records actual outcomes in the VERIFIED tier when provided', () => {
    const r = computeRoiBusinessCase(25, result, {}, {
      observed: { bookingRate: 0.33, responseTimeMinutes: 6 },
      verified: { periodLabel: 'Pilot — 30 days', appointments: 11, opportunities: 3, revenueAttributed: 710 },
    });
    expect(r.observed.bookingRate).toBe(0.33);
    expect(r.observed.responseTimeMinutes).toBe(6);
    expect(r.verified).not.toBeNull();
    expect(r.verified!.tier).toBe('verified');
    expect(r.verified!.appointments).toBe(11);
    expect(r.verified!.revenueAttributed).toBe(710);
  });

  it('never divides by zero at zero leads', () => {
    const r = computeRoiBusinessCase(0, result);
    expect(Number.isFinite(r.modeled.annualRevenueLikely)).toBe(true);
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
