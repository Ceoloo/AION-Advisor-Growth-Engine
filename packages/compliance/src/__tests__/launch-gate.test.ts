import { describe, expect, it } from 'vitest';
import { LAUNCH_APPROVAL_ITEMS, type LaunchApprovalState } from '@aion/types';
import {
  assertLaunchEligible,
  assertLiveCampaignAllowed,
  evaluateLaunchReadiness,
  evaluateLiveCampaignGate,
} from '../launch-gate.js';

/** Build a state with every critical approval granted. */
const allApproved = (): LaunchApprovalState =>
  Object.fromEntries(
    LAUNCH_APPROVAL_ITEMS.map((i) => [i.key, { approved: true, approvedBy: 'Ben Peretz' }]),
  ) as LaunchApprovalState;

const prod = { mode: 'production' as const, allowLiveCampaigns: true };
const pilot = { mode: 'pilot' as const, allowLiveCampaigns: false };

describe('evaluateLaunchReadiness', () => {
  it('is not eligible when nothing is approved', () => {
    const r = evaluateLaunchReadiness({});
    expect(r.launchEligible).toBe(false);
    expect(r.approvedCritical).toBe(0);
    expect(r.missingCritical).toHaveLength(r.totalCritical);
  });

  it('is eligible only when every critical approval is complete', () => {
    const r = evaluateLaunchReadiness(allApproved());
    expect(r.launchEligible).toBe(true);
    expect(r.missingCritical).toHaveLength(0);
    expect(r.approvedCritical).toBe(r.totalCritical);
  });

  it('a single missing critical approval blocks eligibility', () => {
    const state = allApproved();
    delete state.disclosure;
    const r = evaluateLaunchReadiness(state);
    expect(r.launchEligible).toBe(false);
    expect(r.missingCritical.map((i) => i.key)).toEqual(['disclosure']);
  });

  it('treats approved:false the same as missing', () => {
    const state = allApproved();
    state.licensing = { approved: false };
    expect(evaluateLaunchReadiness(state).launchEligible).toBe(false);
  });
});

describe('assertLaunchEligible', () => {
  it('throws with the missing items named', () => {
    const state = allApproved();
    delete state.crm;
    expect(() => assertLaunchEligible(state)).toThrow(/CRM approved/);
  });
  it('does not throw when eligible', () => {
    expect(() => assertLaunchEligible(allApproved())).not.toThrow();
  });
});

describe('live campaign gate — approvals AND capability', () => {
  it('blocks when approvals are complete but the mode forbids live campaigns', () => {
    const gate = evaluateLiveCampaignGate(allApproved(), pilot);
    expect(gate.launchEligible).toBe(true);
    expect(gate.capabilityAllowed).toBe(false);
    expect(gate.allowed).toBe(false);
    expect(gate.reasons.join(' ')).toMatch(/does not permit live campaigns/);
  });

  it('blocks when the mode permits but approvals are incomplete', () => {
    const state = allApproved();
    delete state.messaging;
    const gate = evaluateLiveCampaignGate(state, prod);
    expect(gate.capabilityAllowed).toBe(true);
    expect(gate.launchEligible).toBe(false);
    expect(gate.allowed).toBe(false);
    expect(gate.reasons.join(' ')).toMatch(/Missing critical approvals/);
  });

  it('allows only when BOTH gates pass', () => {
    const gate = evaluateLiveCampaignGate(allApproved(), prod);
    expect(gate.allowed).toBe(true);
    expect(gate.reasons).toHaveLength(0);
  });

  it('assertLiveCampaignAllowed throws unless both gates pass', () => {
    expect(() => assertLiveCampaignAllowed(allApproved(), pilot)).toThrow(/Live campaign blocked/);
    expect(() => assertLiveCampaignAllowed({}, prod)).toThrow(/Live campaign blocked/);
    expect(() => assertLiveCampaignAllowed(allApproved(), prod)).not.toThrow();
  });
});
